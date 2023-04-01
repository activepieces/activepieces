import { bigcommerceRegisterTrigger } from "./register"

const triggerData = [
  {
    name: "customer_created",
    displayName: "Store Customer Created",
    description: "Triggered on Customer creation",
    event: "store/customer/created",
    sampleData: {},
  },
  {
    name: "order_created",
    displayName: "Store Order Created",
    description: "Triggered on Order creation",
    event: "store/order/created",
    sampleData: {},
  }
]

export const bigcommerceTriggers = triggerData.map((trigger) => bigcommerceRegisterTrigger(trigger))