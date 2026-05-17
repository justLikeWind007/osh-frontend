<template>
  <div class="pay-component-container">
    <div class="pay-card">
      <!-- Mode A: pick a payment method -->
      <template v-if="!qrcodeData">
        <section class="pay-section">
          <h3 class="section-title">产品信息</h3>
          <div class="product-item">
            <img :src="data.cover" class="prod-cover" />
            <div class="prod-info">
              <p class="prod-title">{{ data.title }}</p>
            </div>
            <div class="prod-price">
              <span class="currency">¥</span>
              <span class="price-num">{{ data.price }}</span>
            </div>
          </div>
        </section>

        <section class="pay-section">
          <h3 class="section-title">优惠券</h3>
          <div class="coupon-pane">
            <span class="coupon-text">暂无可用优惠券</span>
          </div>
        </section>

        <section class="pay-section">
          <h3 class="section-title">支付方式</h3>
          <div class="method-list">
            <div
              v-for="m in methods"
              :key="m.id"
              class="method-btn"
              :class="{
                active: activeMethod === m.id,
                disabled: m.disabled,
              }"
              @click="handlePickMethod(m)"
            >
              <span class="method-name">{{ m.name }}</span>
              <span v-if="m.disabled" class="method-tag">敬请期待</span>
            </div>
          </div>
        </section>

        <div class="pay-footer">
          <div class="footer-left">
            <span class="warning-tip">请在30分钟内完成支付</span>
          </div>
          <div class="footer-right">
            <div class="final-price-row">
              需支付 <span class="currency">¥</span>
              <span class="price-num">{{ data.price }}</span>
            </div>
            <n-button
              type="primary"
              color="#18a058"
              class="confirm-pay-btn"
              :loading="creating"
              :disabled="creating"
              @click="handleConfirm"
            >
              确认支付
            </n-button>
          </div>
        </div>
      </template>

      <!-- Mode B: show the QR code and poll until paid -->
      <template v-else>
        <section class="qr-section">
          <h3 class="qr-title">
            {{ qrcodeData.pay_type === 'alipay' ? '支付宝扫码支付' : '微信扫码支付' }}
          </h3>
          <p class="qr-amount">
            支付金额 <span class="qr-amount-price">¥{{ data.price }}</span>
          </p>
          <div class="qr-wrap">
            <QrCode :data="qrcodeData.qrcode" />
          </div>
          <p class="qr-tip">
            请使用{{
              qrcodeData.pay_type === 'alipay' ? '支付宝' : '微信'
            }}扫一扫，扫描二维码完成支付
          </p>
          <p :class="['qr-status', { 'qr-status-success': isPaid }]">
            {{ statusText }}
          </p>
          <div class="qr-actions">
            <n-button text size="small" @click="handleCancel" :disabled="isPaid">
              ← 返回重新选择支付方式
            </n-button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { NButton, useMessage } from 'naive-ui';

// Keep `loading` in the prop list for backward-compat with parents that still pass it,
// but the actual loading state is now fully managed inside this component.
const props = defineProps({
  data: { type: Object, required: true },
  loading: { type: Boolean, default: false },
});

// `paid` fires once the upstream gateway reports the order as paid (drives the parent
// view to flip into the "purchased" state). `cancel` fires when the user backs out of
// the QR view before paying.
const emit = defineEmits(['paid', 'cancel']);

const message = useMessage();

const activeMethod = ref('wechat');
const methods = [
  { id: 'wechat', name: '微信支付', disabled: false },
  { id: 'alipay', name: '支付宝', disabled: false },
  { id: 'union', name: '银联支付', disabled: true },
];

// State for the "create payment" step.
const creating = ref(false);

// When set, the template switches to the QR view. Shape: { qrcode, out_trade_no, pay_type }
const qrcodeData = ref(null);

// Polling state.
const pollingTimer = ref(null);
const isPaid = ref(false);

const statusText = computed(() => {
  if (isPaid.value) return '✓ 支付成功，正在解锁课程…';
  return '等待支付中…';
});

function handlePickMethod(m) {
  if (m.disabled) {
    message.info(`${m.name} 暂未开通，敬请期待`);
    return;
  }
  activeMethod.value = m.id;
}

async function handleConfirm() {
  if (creating.value) return;

  // Translate the UI's "wechat" into the backend's "wxpay".
  const payType = activeMethod.value === 'wechat' ? 'wxpay' : activeMethod.value;
  if (payType !== 'wxpay' && payType !== 'alipay') {
    message.warning('请选择支付方式');
    return;
  }

  creating.value = true;
  const { data: resp, error } = await useCoursePayCreateApi({
    course_id: props.data.id,
    pay_type: payType,
  });
  creating.value = false;

  if (error.value) {
    // useHttp already surfaced a toast for the server-side error; nothing else to do.
    return;
  }
  if (!resp.value || !resp.value.qrcode) {
    message.error('未拿到支付二维码，请稍后重试');
    return;
  }

  qrcodeData.value = {
    qrcode: resp.value.qrcode,
    out_trade_no: resp.value.out_trade_no,
    pay_type: resp.value.pay_type || payType,
  };
  startPolling();
}

function startPolling() {
  stopPolling();
  pollingTimer.value = setInterval(async () => {
    if (!qrcodeData.value) return;
    const { data: res } = await useCoursePayStatusApi(qrcodeData.value.out_trade_no);
    if (res && res.value && res.value.paid) {
      handlePaidSuccess();
    }
  }, 2000);
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
}

function handlePaidSuccess() {
  if (isPaid.value) return; // guard against double-fire
  isPaid.value = true;
  stopPolling();
  message.success('支付成功');
  // Give the user a beat to see the success text before the parent flips the view.
  setTimeout(() => {
    emit('paid');
  }, 800);
}

function handleCancel() {
  stopPolling();
  qrcodeData.value = null;
  isPaid.value = false;
  emit('cancel');
}

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped>
.pay-component-container {
  background-color: #f4f6f8;
  padding: 30px 0;
  min-height: 80vh;
}

.pay-card {
  max-width: 1000px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 2px;
  padding: 20px 25px;
}

.pay-section {
  margin-bottom: 25px;
}
.section-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
  font-weight: normal;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 15px;
}
.prod-cover {
  width: 110px;
  height: 65px;
  object-fit: cover;
  border-radius: 2px;
}
.prod-info {
  flex: 1;
}
.prod-title {
  font-size: 14px;
  color: #333;
  margin: 0;
}
.prod-price {
  color: #e63946;
  font-weight: bold;
}
.prod-price .currency {
  font-size: 12px;
  margin-right: 2px;
}
.prod-price .price-num {
  font-size: 16px;
}

.coupon-pane {
  background: #fdfdfd;
  border: 1px solid #eee;
  padding: 10px 15px;
  width: fit-content;
  border-radius: 2px;
}
.coupon-text {
  font-size: 13px;
  color: #bbb;
}

.method-list {
  display: flex;
  gap: 10px;
}
.method-btn {
  border: 1px solid #eee;
  padding: 8px 18px;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  color: #666;
  font-size: 13px;
  background: #fff;
}
.method-btn.active {
  border-color: #18a058;
  color: #18a058;
  background-color: #f6ffed;
}
.method-btn.disabled {
  color: #c0c4cc;
  background: #fafafa;
  cursor: not-allowed;
}
.method-tag {
  font-size: 11px;
  color: #c0c4cc;
  border: 1px dashed #ddd;
  padding: 0 4px;
  border-radius: 2px;
}

.pay-footer {
  margin-top: 40px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.footer-right {
  text-align: right;
}

.warning-tip {
  color: #f44336;
  font-size: 12px;
}

.final-price-row {
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
}
.final-price-row .currency {
  color: #f44336;
  margin: 0 1px;
}
.final-price-row .price-num {
  font-size: 18px;
  color: #f44336;
  font-weight: bold;
}

.confirm-pay-btn {
  height: 32px;
  border-radius: 2px;
  padding: 0 20px;
  font-size: 13px;
}

/* --- QR view (mode B) --- */
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 12px;
  text-align: center;
}
.qr-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 10px;
}
.qr-amount {
  font-size: 13px;
  color: #666;
  margin: 0 0 18px;
}
.qr-amount-price {
  color: #e63946;
  font-weight: bold;
  font-size: 18px;
  margin-left: 4px;
}
.qr-wrap {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fff;
}
.qr-tip {
  font-size: 13px;
  color: #666;
  margin: 16px 0 6px;
}
.qr-status {
  font-size: 13px;
  color: #909399;
  margin: 4px 0 16px;
}
.qr-status-success {
  color: #18a058;
  font-weight: bold;
}
.qr-actions {
  margin-top: 8px;
}
</style>
