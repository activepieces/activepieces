terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "wasper-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_D2s_v3"  # 2 vCPU, 8GB RAM - ~$70/month
  # Alternative: "Standard_D4s_v3" # 4 vCPU, 16GB RAM - ~$140/month
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "wasperadmin"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "domain_name" {
  description = "Domain name for Wasper (e.g., wasper.yourdomain.com)"
  type        = string
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "prod"
}

# Random suffix for unique names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Resource Group
resource "azurerm_resource_group" "wasper" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Application = "Wasper"
    ManagedBy   = "Terraform"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "wasper" {
  name                = "wasper-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.wasper.location
  resource_group_name = azurerm_resource_group.wasper.name

  tags = {
    Environment = var.environment
  }
}

# Subnet
resource "azurerm_subnet" "wasper" {
  name                 = "wasper-subnet"
  resource_group_name  = azurerm_resource_group.wasper.name
  virtual_network_name = azurerm_virtual_network.wasper.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Network Security Group
resource "azurerm_network_security_group" "wasper" {
  name                = "wasper-nsg"
  location            = azurerm_resource_group.wasper.location
  resource_group_name = azurerm_resource_group.wasper.name

  # SSH
  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # HTTP
  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # HTTPS
  security_rule {
    name                       = "HTTPS"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    Environment = var.environment
  }
}

# Public IP
resource "azurerm_public_ip" "wasper" {
  name                = "wasper-public-ip"
  location            = azurerm_resource_group.wasper.location
  resource_group_name = azurerm_resource_group.wasper.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = {
    Environment = var.environment
  }
}

# Network Interface
resource "azurerm_network_interface" "wasper" {
  name                = "wasper-nic"
  location            = azurerm_resource_group.wasper.location
  resource_group_name = azurerm_resource_group.wasper.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.wasper.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.wasper.id
  }

  tags = {
    Environment = var.environment
  }
}

# Associate NSG with NIC
resource "azurerm_network_interface_security_group_association" "wasper" {
  network_interface_id      = azurerm_network_interface.wasper.id
  network_security_group_id = azurerm_network_security_group.wasper.id
}

# Managed Disk for Data (Database storage)
resource "azurerm_managed_disk" "wasper_data" {
  name                 = "wasper-data-disk"
  location             = azurerm_resource_group.wasper.location
  resource_group_name  = azurerm_resource_group.wasper.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = 128

  tags = {
    Environment = var.environment
  }
}

# Virtual Machine
resource "azurerm_linux_virtual_machine" "wasper" {
  name                  = "wasper-vm"
  location              = azurerm_resource_group.wasper.location
  resource_group_name   = azurerm_resource_group.wasper.name
  network_interface_ids = [azurerm_network_interface.wasper.id]
  size                  = var.vm_size

  os_disk {
    name                 = "wasper-os-disk"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 128
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  computer_name                   = "wasper"
  admin_username                  = var.admin_username
  disable_password_authentication = true

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yml", {
    domain_name = var.domain_name
  }))

  tags = {
    Environment = var.environment
  }
}

# Attach data disk to VM
resource "azurerm_virtual_machine_data_disk_attachment" "wasper" {
  managed_disk_id    = azurerm_managed_disk.wasper_data.id
  virtual_machine_id = azurerm_linux_virtual_machine.wasper.id
  lun                = 0
  caching            = "ReadWrite"
}

# Outputs
output "public_ip_address" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.wasper.ip_address
}

output "vm_id" {
  description = "ID of the virtual machine"
  value       = azurerm_linux_virtual_machine.wasper.id
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.wasper.name
}

output "ssh_connection_string" {
  description = "SSH connection command"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.wasper.ip_address}"
}

output "dns_configuration" {
  description = "DNS A record configuration for Cloudflare"
  value = {
    type    = "A"
    name    = var.domain_name
    content = azurerm_public_ip.wasper.ip_address
    proxied = false
  }
}
