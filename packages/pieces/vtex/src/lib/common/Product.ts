import axios, { Axios } from "axios";
import { CreateProductParams, UpdateProductParams, GetProductByIdResponse } from "./types";

const baseUrl = "vindi.myvtex.com";

const apiKey = "vtexappkey-vindi-CWSWOB"
const apiToken = "KFLHJYTGTKABUBUCIKYNBCUCOCWEYSKCNYUUPCRLVGXQICDDJALRZQJQCHVUQGVHLDNFMSCDXFEHYYKCHULEJZTYVPREOGEZHWVHIYTXVUTHPMCIJCWDPWYGKZEXYVKX"


export class Product {
  api: Axios;

  constructor(host: string, appKey: string, appToken: string) {
    this.api = axios.create({
      baseURL: "https://" + host,
      headers: {
        "X-VTEX-API-AppKey": appKey,
        "X-VTEX-API-AppToken": appToken
      }
    });
  }

  async getProductById(productID: number) : Promise<GetProductByIdResponse> {
    const route = "/api/catalog/pvt/product/";
    const response = await this.api.get(route + productID);
    return response.data;
  }

  async createProduct(newProductData: CreateProductParams) {
    const route = "/api/catalog/pvt/product";
    const response = await this.api.post(route, newProductData);
    return response.data;
  }

  async updateProduct(productID: number, updatedProductData: UpdateProductParams) {
    const route = "/api/catalog/pvt/product/";
    const response = await this.api.put(route + productID, updatedProductData);
    return response.data;
  }
}

const product = new Product(baseUrl, apiKey, apiToken);
product.getProductById(1)
  .then(data => console.log(data))
  .catch(err => {
    console.log(err.message)
  })
