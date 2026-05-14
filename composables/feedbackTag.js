const defaultFeedbackTagDefinitions = [
  { code: 'course-content', name: '课程内容' },
  { code: 'ui-experience', name: '界面体验' },
  { code: 'course-design', name: '课程设计' },
  { code: 'course-player', name: '课程播放器' },
  { code: 'exam-module', name: '考试模块' },
  { code: 'community-module', name: '社区互动' },
  { code: 'learning-path', name: '学习路径' },
  { code: 'resource-material', name: '资料资源' },
  { code: 'account-login', name: '账号登录' },
  { code: 'performance-stability', name: '性能稳定' },
]

const defaultFeedbackTagPriorityMap = defaultFeedbackTagDefinitions.reduce((result, tag, index) => {
  result[tag.code] = index
  result[tag.name] = index
  return result
}, {})

const customFeedbackTagPriority = defaultFeedbackTagDefinitions.length + 100

function resolveFeedbackTagPriority(tag) {
  return defaultFeedbackTagPriorityMap[tag?.code] ?? defaultFeedbackTagPriorityMap[tag?.name] ?? customFeedbackTagPriority
}

function resolveFeedbackTagSortOrder(tag) {
  return Number.isFinite(Number(tag?.sortOrder)) ? Number(tag.sortOrder) : Number.MAX_SAFE_INTEGER
}

function resolveFeedbackTagUseCount(tag) {
  return Number.isFinite(Number(tag?.useCount)) ? Number(tag.useCount) : -1
}

function resolveFeedbackTagId(tag) {
  return Number.isFinite(Number(tag?.id)) ? Number(tag.id) : Number.MAX_SAFE_INTEGER
}

export function sortFeedbackTags(tags = []) {
  return [...(Array.isArray(tags) ? tags : [])].sort((leftTag, rightTag) => {
    const leftPriority = resolveFeedbackTagPriority(leftTag)
    const rightPriority = resolveFeedbackTagPriority(rightTag)
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    const leftSortOrder = resolveFeedbackTagSortOrder(leftTag)
    const rightSortOrder = resolveFeedbackTagSortOrder(rightTag)
    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder
    }

    const leftUseCount = resolveFeedbackTagUseCount(leftTag)
    const rightUseCount = resolveFeedbackTagUseCount(rightTag)
    if (leftUseCount !== rightUseCount) {
      return rightUseCount - leftUseCount
    }

    return resolveFeedbackTagId(leftTag) - resolveFeedbackTagId(rightTag)
  })
}
