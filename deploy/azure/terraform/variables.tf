# Azure region
variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus"

  validation {
    condition     = can(regex("^[a-z]+$", var.location))
    error_message = "Location must be a valid Azure region (e.g., eastus, westus2, westeurope)."
  }
}

# Resource group
variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "wasper-rg"

  validation {
    condition     = length(var.resource_group_name) > 0 && length(var.resource_group_name) <= 90
    error_message = "Resource group name must be between 1 and 90 characters."
  }
}

# VM size
variable "vm_size" {
  description = "Azure VM size (Standard_D2s_v3 = 2vCPU/8GB, Standard_D4s_v3 = 4vCPU/16GB)"
  type        = string
  default     = "Standard_D2s_v3"

  validation {
    condition     = contains(["Standard_B2ms", "Standard_D2s_v3", "Standard_D4s_v3", "Standard_D2as_v4", "Standard_D4as_v4"], var.vm_size)
    error_message = "VM size must be one of: Standard_B2ms, Standard_D2s_v3, Standard_D4s_v3, Standard_D2as_v4, Standard_D4as_v4."
  }
}

# Admin username
variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "wasperadmin"

  validation {
    condition     = length(var.admin_username) >= 3 && length(var.admin_username) <= 20
    error_message = "Admin username must be between 3 and 20 characters."
  }
}

# SSH public key
variable "ssh_public_key_path" {
  description = "Path to SSH public key for VM access"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# Domain name
variable "domain_name" {
  description = "Fully qualified domain name for Wasper (e.g., wasper.example.com)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+(\\.[a-z0-9-]+)+$", var.domain_name))
    error_message = "Domain name must be a valid FQDN (e.g., wasper.example.com)."
  }
}

# Environment
variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be one of: prod, staging, dev."
  }
}

# OS disk size
variable "os_disk_size_gb" {
  description = "Size of the OS disk in GB"
  type        = number
  default     = 128

  validation {
    condition     = var.os_disk_size_gb >= 64 && var.os_disk_size_gb <= 2048
    error_message = "OS disk size must be between 64 and 2048 GB."
  }
}

# Data disk size
variable "data_disk_size_gb" {
  description = "Size of the data disk in GB (for database)"
  type        = number
  default     = 128

  validation {
    condition     = var.data_disk_size_gb >= 64 && var.data_disk_size_gb <= 4096
    error_message = "Data disk size must be between 64 and 4096 GB."
  }
}

# Enable SSH from specific IP
variable "ssh_source_address_prefix" {
  description = "Source IP address prefix for SSH access (* for any, or specific IP/CIDR)"
  type        = string
  default     = "*"
}

# Tags
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
