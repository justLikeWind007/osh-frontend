
<template>
  <div class="result-page">
    <div class="result-card">

      <!-- ── 成功状态 ── -->
      <template v-if="status === 'success'">
        <div class="result-icon">🎉</div>
        <h2 class="result-title">抢购成功！</h2>

        <!-- 商品信息 -->
        <div class="result-info">
          <div class="info-row" v-if="cover">
            <img :src="decodeURIComponent(cover)" class="goods-cover" />
          </div>
          <div class="info-row">
            <span class="info-label">商品</span>
            <span class="info-value">{{ title }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">原价</span>
            <span class="info-value origin-price-text">¥{{ originPrice }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">秒杀价</span>
            <span class="info-value price-text">¥{{ price }}</span>
          </div>
          <div class="info-row" v-if="seckillNo">
            <span class="info-label">秒杀单号</span>
            <span class="info-value order-no">{{ seckillNo }}</span>
          </div>
          <div class="info-row" v-if="payExpireTime">
            <span class="info-label">支付截止</span>
            <span class="info-value expire-text">{{ decodeURIComponent(payExpireTime) }}</span>
          </div>
        </div>

        <!-- 支付倒计时 -->
        <ClientOnly>
          <div class="pay-countdown" v-if="payDeadlineMs > 0 && !payDone && !payExpired">
            <span class="pay-countdown-label">⏰ 剩余支付时间：</span>
            <CountDown :key="payDeadlineMs" :time="payDeadlineMs" @end="handlePayExpire" />
          </div>
        </ClientOnly>
        <div class="pay-expired-tip" v-if="payExpired">⚠️ 支付已超时，订单已自动取消</div>
        <div class="pay-success-tip" v-if="payDone">🎉 支付成功，正在跳转...</div>

        <!-- 支付区域 -->
        <div class="qr-section" v-if="!payDone && !payExpired">
          <!-- 未发起支付 -->
          <template v-if="!payData">
            <button class="btn-primary" :disabled="payLoading" @click="handlePay">
              <span v-if="payLoading">⏳ 正在获取支付码...</span>
              <span v-else>立即支付 ¥{{ price }}</span>
            </button>
          </template>
          <!-- 已获取二维码 -->
          <template v-else>
            <p class="qr-tip">请使用微信扫码完成支付</p>
            <!-- qrcode/payUrl 都是支付链接，用 QrCode 组件生成二维码 -->
            <QrCode v-if="payData.qrcode" :data="payData.qrcode" />
            <QrCode v-else-if="payData.payUrl" :data="payData.payUrl" />
            <p class="qr-sub-tip">二维码有效期内请尽快扫码支付</p>
            <button class="btn-refresh" @click="handlePay" :disabled="payLoading">
              {{ payLoading ? '刷新中...' : '🔄 刷新二维码' }}
            </button>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div class="action-row" v-if="!payDone && !payExpired">
          <button class="btn-cancel" :disabled="cancelLoading" @click="handleCancel">
            {{ cancelLoading ? '取消中...' : '取消订单' }}
          </button>
        </div>
        <button class="btn-secondary" @click="goSeckill">继续逛逛</button>
      </template>

      <!-- ── 失败状态 ── -->
      <template v-else>
        <div class="result-icon">😔</div>
        <h2 class="result-title">很遗憾，名额已被抢完</h2>
        <p class="result-desc">本场次优惠名额已售罄，可以查看其他优惠课程或等待下次活动</p>
        <div class="result-actions">
          <button class="btn-primary" @click="goSeckill">查看其他优惠课程</button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { createDiscreteApi } from 'naive-ui'

const route = useRoute()
const { status, title, cover, price, originPrice, seckillNo, payExpireTime } = route.query

const { message, dialog } = createDiscreteApi(['message', 'dialog'])

// ── 带 token 的 $fetch（统一解决 token 取不到的问题） ─────────
const { seckillFetch } = useSeckillFetch()

// ── 支付截止时间（毫秒） ──────────────────────────────────────
const payDeadlineMs = computed(() => {
  if (!payExpireTime) return 0
  const t = new Date(decodeURIComponent(payExpireTime).replace(' ', 'T')).getTime()
  return isNaN(t) ? 0 : t
})

// ── 支付状态 ─────────────────────────────────────────────────
const payDone    = ref(false)
const payExpired = ref(false)

function handlePayExpire() {
  payExpired.value = true
  stopPayPolling()
}

// ── 页面加载时查一次真实订单状态，避免依赖 URL 参数里的过期时间 ──
onMounted(async () => {
  if (!seckillNo) return
  try {
    const res = await seckillFetch(`/seckill/user/order/status/${seckillNo}`)
    if (res?.code !== 200 || !res?.data) return
    const s = res.data.status
    if (s === 1) {
      // 已支付，直接跳转
      handlePaySuccess()
    } else if (s === 2 || s === 3) {
      // 已取消或已超时，标记为超时
      payExpired.value = true
    }
    // s === 0 待支付，正常展示页面
  } catch {
    // 查询失败，不影响页面展示
  }
})

// ── 发起支付（接口：POST /seckill/user/order/pay/{seckillNo}） ─
const payLoading = ref(false)
const payData    = ref(null)  // { code, payUrl, qrcode, outTradeNo }
const payTimer   = ref(null)

async function handlePay() {
  if (!seckillNo) return
  payLoading.value = true
  try {
    // 先主动查一次状态，防止已支付还能重新发起
    await checkPayStatus()
    if (payDone.value) return

    const res = await seckillFetch(`/seckill/user/order/pay/${seckillNo}`, { method: 'POST' })
    if (res?.code === 200 && res?.data) {
      payData.value = res.data
      startPayPolling()
    } else {
      message.error(res?.msg || '获取支付信息失败')
    }
  } catch (e) {
    message.error(e?.data?.msg || '获取支付信息失败，请重试')
  } finally {
    payLoading.value = false
  }
}

// ── 轮询支付状态（接口：GET /seckill/user/order/status/{seckillNo}）
// 每2秒轮询，无上限——直到支付成功、超时、取消才停止
function startPayPolling() {
  stopPayPolling()
  payTimer.value = setInterval(async () => {
    await checkPayStatus()
  }, 2000)
}

// 单次查询支付状态，可复用（轮询 & 手动触发）
async function checkPayStatus() {
  let res
  try {
    res = await seckillFetch(`/seckill/user/order/status/${seckillNo}`)
  } catch {
    return
  }

  if (res?.code !== 200 || !res?.data) return

  const s = res.data.status
  if (s === 1) {
    handlePaySuccess()
  } else if (s === 0) {
    // 待支付，继续等
  } else if (s === 2) {
    stopPayPolling()
    message.warning('订单已取消')
    navigateTo('/seckill', { replace: true })
  } else if (s === 3) {
    stopPayPolling()
    payExpired.value = true
  } else if (s === 4) {
    stopPayPolling()
    message.info('订单已退款')
  }
}

function stopPayPolling() {
  if (payTimer.value) {
    clearInterval(payTimer.value)
    payTimer.value = null
  }
}

function handlePaySuccess() {
  payDone.value = true
  stopPayPolling()
  message.success('支付成功！')
  setTimeout(() => navigateTo('/user/buy/1', { replace: true }), 2000)
}

// ── 取消订单（接口：POST /seckill/user/order/cancel/{seckillNo}）
const cancelLoading = ref(false)

async function handleCancel() {
  if (!seckillNo) return

  // 取消前先查一次最新状态，防止已支付的订单被取消
  await checkPayStatus()
  if (payDone.value) {
    message.warning('订单已支付，无法取消')
    return
  }

  const confirmed = await new Promise(resolve => {
    dialog.warning({
      title: '取消订单',
      content: '确认取消此秒杀订单？取消后名额将释放。',
      positiveText: '确认取消',
      negativeText: '再想想',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
  if (!confirmed) return
  cancelLoading.value = true
  try {
    const res = await seckillFetch(`/seckill/user/order/cancel/${seckillNo}`, { method: 'POST' })
    if (res?.code === 200) {
      message.success('订单已取消')
      stopPayPolling()
      navigateTo('/seckill', { replace: true })
    } else {
      message.error(res?.msg || '取消失败')
    }
  } catch (e) {
    message.error(e?.data?.msg || '取消失败')
  } finally {
    cancelLoading.value = false
  }
}

function goSeckill() {
  navigateTo('/seckill')
}

onUnmounted(() => stopPayPolling())
</script>

<style scoped>
.result-page {
  display: flex; justify-content: center; align-items: flex-start;
  min-height: 60vh; padding: 40px 16px;
}
.result-card {
  background: #fff; border-radius: 16px; padding: 40px 36px;
  text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  width: 100%; max-width: 460px;
  display: flex; flex-direction: column; gap: 14px;
}
.result-icon { font-size: 52px; line-height: 1; }
.result-title { font-size: 22px; font-weight: 700; color: #111; margin: 0; }
.result-desc  { font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6; }

/* 订单信息 */
.result-info {
  background: #f9fafb; border-radius: 10px;
  padding: 14px 18px; text-align: left;
}
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #6b7280; }
.info-value { color: #111; font-weight: 500; max-width: 260px; text-align: right; }
.price-text  { color: #f43f5e; font-weight: 700; font-size: 16px; }
.order-no    { font-size: 12px; color: #9ca3af; }
.expire-text { color: #f59e0b; font-size: 13px; }

/* 支付倒计时 */
.pay-countdown {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-size: 14px; color: #374151;
  background: #fff7ed; border-radius: 8px; padding: 10px 16px;
}
.pay-countdown-label { color: #f59e0b; font-weight: 600; }
.pay-expired-tip { color: #ef4444; font-size: 14px; background: #fef2f2; border-radius: 8px; padding: 10px; }
.pay-success-tip { color: #22c55e; font-size: 14px; background: #f0fdf4; border-radius: 8px; padding: 10px; }

/* 二维码区域 */
.qr-section { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.qr-tip     { font-size: 14px; color: #374151; margin: 0; }
.qr-sub-tip { font-size: 12px; color: #9ca3af; margin: 0; }

/* 按钮 */
.btn-primary {
  width: 100%; padding: 13px 0;
  background: linear-gradient(135deg, #ff6b35, #f43f5e);
  color: #fff; border: none; border-radius: 8px;
  font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  width: 100%; padding: 12px 0; background: #fff;
  color: #374151; border: 1px solid #e5e7eb; border-radius: 8px;
  font-size: 15px; cursor: pointer; transition: all 0.2s;
}
.btn-secondary:hover { border-color: #f43f5e; color: #f43f5e; }
.btn-cancel {
  width: 100%; padding: 10px 0; background: transparent;
  color: #9ca3af; border: 1px dashed #e5e7eb; border-radius: 8px;
  font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover:not(:disabled) { color: #ef4444; border-color: #ef4444; }
.btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

.result-actions { display: flex; flex-direction: column; gap: 10px; }

/* 商品封面 */
.goods-cover {
  width: 100%; max-height: 140px; object-fit: cover;
  border-radius: 8px; margin-bottom: 4px;
}
.origin-price-text { color: #9ca3af; text-decoration: line-through; font-size: 13px; }

/* 二维码图片 */
.qr-img {
  width: 180px; height: 180px;
  border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 8px; background: #fff;
}

/* 刷新按钮 */
.btn-refresh {
  padding: 6px 16px; background: transparent;
  color: #6b7280; border: 1px solid #e5e7eb;
  border-radius: 6px; font-size: 12px; cursor: pointer;
  transition: all 0.2s;
}
.btn-refresh:hover:not(:disabled) { border-color: #f43f5e; color: #f43f5e; }
.btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }

/* 操作行 */
.action-row { width: 100%; }
</style>
