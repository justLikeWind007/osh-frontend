import { computed } from 'vue'
import { resolveFeedbackStatusText } from '~/composables/assistant'

export function useFeedbackDetailStatusView(detail) {
  const statusSteps = [
    { label: '提交', value: 'PENDING' },
    { label: '处理中', value: 'PROCESSING' },
    { label: '已解决', value: 'RESOLVED' }
  ]

  const currentStepIndex = computed(() => {
    const currentStatus = detail.value?.status
    if (currentStatus === 'PENDING') return 0
    if (currentStatus === 'PROCESSING') return 1
    if (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED') return 2
    return 0
  })

  const isFeedbackClosed = computed(() => {
    return detail.value?.status === 'CLOSED' || detail.value?.status === 'RESOLVED'
  })

  const operationLogs = computed(() => {
    if (detail.value?.processRecords?.length) {
      return detail.value.processRecords.map(record => {
        const operator = record.operatorName || '系统'
        if (!record.fromStatus) {
          return {
            text: `【${operator}】${record.remark || '提交了反馈'}`,
            time: formatAbsoluteTime(record.createTime),
            type: 'system',
            remark: record.remark
          }
        }

        const fromText = resolveFeedbackStatusText(record.fromStatus)
        const toText = resolveFeedbackStatusText(record.toStatus)
        let logType = 'operation'
        if (record.toStatus === 'CLOSED') {
          logType = 'close'
        } else if (record.toStatus === 'RESOLVED') {
          logType = 'resolve'
        }

        return {
          text: `【${operator}】${fromText} → ${toText}`,
          time: formatAbsoluteTime(record.createTime),
          type: logType,
          remark: record.remark
        }
      })
    }

    return [{
      text: '【系统】创建反馈',
      time: formatAbsoluteTime(detail.value?.createTime),
      type: 'system'
    }]
  })

  const availableStatusActions = computed(() => {
    const currentStatus = detail.value?.status
    if (currentStatus === 'PENDING') {
      return [
        { label: '标记为处理中', value: 'PROCESSING', type: 'primary', placeholder: '请输入开始处理说明' },
        { label: '关闭反馈', value: 'CLOSED', type: 'default', placeholder: '请输入关闭原因' }
      ]
    }
    if (currentStatus === 'PROCESSING') {
      return [
        { label: '完成处理', value: 'RESOLVED', type: 'primary', placeholder: '请输入处理完成说明' },
        { label: '关闭反馈', value: 'CLOSED', type: 'default', placeholder: '请输入关闭原因' }
      ]
    }
    return []
  })

  return {
    statusSteps,
    currentStepIndex,
    isFeedbackClosed,
    operationLogs,
    availableStatusActions
  }
}

function formatAbsoluteTime(time) {
  if (!time) {
    return ''
  }
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
