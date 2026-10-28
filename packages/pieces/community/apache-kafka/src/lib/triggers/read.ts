import { kafkaClient } from '../common/client'
import { type KafkaAuthInput, kafkaConfig } from '../common/config'
import { kafkaRecords } from '../common/records'

const SAMPLE_MESSAGE_COUNT = 5
const SAMPLE_BATCH_SIZE = 10

async function poll({ auth, props, batch }: {
  auth: KafkaAuthInput
  props: TriggerProps
  batch: boolean
}) {
  const records = await kafkaClient.poll({
    auth,
    topic: props.topic,
    consumerGroup: props.consumerGroup,
    maxMessages: props.maxMessages,
    pollTimeoutSeconds: props.pollTimeoutSeconds,
    fromBeginning: kafkaConfig.readStartFrom(props.startFrom),
  })
  return kafkaRecords.toTriggerOutput({ records, topic: kafkaConfig.readTopic(props.topic), batch })
}

async function sample({ auth, props, batch }: {
  auth: KafkaAuthInput
  props: TriggerProps
  batch: boolean
}) {
  const records = await kafkaClient.sample({
    auth,
    topic: props.topic,
    consumerGroup: props.consumerGroup,
    count: Math.min(kafkaConfig.readMaxMessages(props.maxMessages), batch ? SAMPLE_BATCH_SIZE : SAMPLE_MESSAGE_COUNT),
    pollTimeoutSeconds: props.pollTimeoutSeconds,
  })
  return kafkaRecords.toTriggerOutput({ records, topic: kafkaConfig.readTopic(props.topic), batch })
}

async function enable({ auth, props }: { auth: KafkaAuthInput, props: TriggerProps }) {
  await kafkaClient.pinStartOffsets({
    auth,
    topic: props.topic,
    consumerGroup: props.consumerGroup,
    fromBeginning: kafkaConfig.readStartFrom(props.startFrom),
  })
}

export const kafkaTriggerRead = {
  poll,
  sample,
  enable,
}

type TriggerProps = {
  topic: string
  consumerGroup: string
  maxMessages: number
  pollTimeoutSeconds: number
  startFrom: string
}
