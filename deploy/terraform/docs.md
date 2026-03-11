kubectl create secret generic \
  activepieces-stripe-secret \
    --namespace activepieces \
    --from-literal=secretKey='<STRIPE_SECRET_KEY>' \
    --from-literal=webhookSecret='<STRIPE_WEBHOOK_SECRET>'