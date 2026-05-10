<template>
    <div class="app-layout">
        <NavBar/>
        <main class="main-content">
            <div class="content-wrapper">
                <slot/>
            </div>
        </main>
        <PageFooter/>
        <ClientOnly v-if="shouldShowAssistant">
            <AssistantFloatingAssistantShell />
        </ClientOnly>
    </div>
</template>

<script setup>
const token = useCookie('token')

const shouldShowAssistant = computed(() => {
    return !!token.value
})
</script>

<style scoped>
/* Leantime-inspired Layout */
.app-layout {
    min-width: 1000px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
}

.main-content {
    flex: 1;
    width: 100%;
    padding: var(--space-xl) 0;
}

.content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
}

/* Responsive */
@media (max-width: 1200px) {
    .content-wrapper {
        max-width: 100%;
        padding: 0 var(--space-md);
    }
}

@media (max-width: 768px) {
    .app-layout {
        min-width: auto;
    }
    
    .main-content {
        padding: var(--space-lg) 0;
    }
}
</style>
