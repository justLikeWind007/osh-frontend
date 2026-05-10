export const useFeedbackInteractionPatches = () => useState('feedback_interaction_patches', () => ({}))

export function patchFeedbackInteraction(feedbackId, patch) {
  if (!feedbackId) {
    return
  }

  const interactionPatches = useFeedbackInteractionPatches()
  const currentPatches = interactionPatches.value || {}
  const currentPatch = currentPatches[feedbackId] || {}

  interactionPatches.value = {
    ...currentPatches,
    [feedbackId]: {
      ...currentPatch,
      ...patch,
    },
  }
}

export function applyFeedbackInteractionPatches(feedbackList) {
  const interactionPatches = useFeedbackInteractionPatches()
  const currentPatches = interactionPatches.value || {}

  return (feedbackList || []).map(item => {
    const itemPatch = currentPatches[item?.id]
    return itemPatch ? { ...item, ...itemPatch } : item
  })
}
