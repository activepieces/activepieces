import { FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class ShopifyCustomerTagging implements Scenario<FlowType> {
    title = 'Shopify Customer Tagging';

    prompt() {
        return `when a new shopify customer come,send a welcome email to the customer.if customer name contains 'test',then add  'test' tag to the customer,else add 'vip' tag to the customer`;
    }
}