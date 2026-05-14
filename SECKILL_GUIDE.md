# 虚拟商品秒杀功能使用指南

## 功能概述

秒杀模块面向安全生产类在线教育平台，支持网课、电子书、题库等虚拟商品的限时限量优惠抢购。与实物电商秒杀不同，虚拟商品购买后直接解锁内容，无需等待发货。核心卖点是"优惠名额 + 价格恢复倒计时"带来的紧迫感，以及课程大纲预览、讲师信息、试看片段等内容信任背书。

## 路由规划

| 路由 | 文件 | 说明 |
|------|------|------|
| `/seckill` | `pages/seckill/index.vue` | 秒杀活动首页 |
| `/seckill/detail/[id]` | `pages/seckill/detail/[id].vue` | 秒杀商品详情 |
| `/seckill/result` | `pages/seckill/result.vue` | 抢购结果页 |

## 主要功能

### 1. 秒杀活动首页 (`/seckill`)

- **顶部 Banner**：活动主题文案 + 全局倒计时（基于服务端时间戳）
- **场次 Tab 切换**：支持多场次（如 10:00 / 14:00 / 20:00），每场次有独立状态
  - `进行中`：红色高亮，可抢购
  - `即将开始`：灰色禁用，显示距开始倒计时
  - `已结束`：暗灰禁用
- **商品卡片**：封面图、限量名额标签、商品名、讲师+学员数、课时/页数/题目数+有效期、划线原价+秒杀价、名额进度条、抢购按钮
- **按钮三种状态**：
  - 灰色禁用：场次未开始，显示距开始倒计时
  - 红色高亮：`立即抢购`
  - 暗灰禁用：名额已满，变为 `¥599 原价购买`（不消失，引导原价购买）
- **筛选栏**：
  - 商品类型：全部 / 网课 / 电子书 / 题库
  - 分类：安全生产 / 消防安全 / 应急管理

### 2. 秒杀商品详情 (`/seckill/detail/[id]`)

- **左侧区域**：
  - 课程封面大图
  - 试看按钮（免费试看入口）
  - 课程大纲折叠展示（复用 `CourseOutline` 组件）
- **右侧区域**：
  - 商品名称、讲师评分
  - 秒杀价 + 原价 + 已优惠金额
  - 场次倒计时（精确到秒，基于服务端时间）
  - 剩余名额（进度条 + 文案"已抢 80% 名额"）
  - 限购说明（如：每人限购 1 件）
  - 服务承诺（正版授权 / 随时退款 / 永久有效）
  - `立即抢购` 按钮 / `去学习` 按钮（已购用户）
  - `加入购物车` 按钮
- **下方 Tab**：课程介绍 / 课程大纲 / 讲师介绍 / 用户评价

### 3. 抢购结果页 (`/seckill/result`)

通过 `?status=success` 或 `?status=fail` 区分两种状态。

- **成功状态**：
  - 商品名称、实付金额、有效期
  - `立即去学习` 按钮（跳转课程学习页）
  - `查看订单` 按钮（跳转 `/user/buy/1`）
- **失败状态（名额已满）**：
  - `查看其他优惠课程` 按钮（返回秒杀首页）
  - `加入下次提醒` 按钮（订阅下场次通知）

## 商品类型差异化展示

| 字段 | 网课 | 电子书 | 题库 |
|------|------|--------|------|
| 主要信息 | 课时数 / 讲师姓名 | 页数 / 格式 / 作者 | 题目数 / 通过率 |
| 封面比例 | 16:9 横版 | 3:4 竖版 | 16:9 横版 |
| 试看入口 | 视频试看 | 章节试读 | 样题预览 |

## 支付流程

```
立即抢购
  → POST /order/flashsale（锁定名额，创建订单）
  → 返回订单号 no
  → navigateTo('/pay?no=xxx')（复用现有微信支付页）
  → 支付成功轮询 /order/iswxpay
  → navigateTo('/seckill/result?status=success&...')
```

失败分支（名额已满或下单失败）：
```
POST /order/flashsale 返回错误
  → navigateTo('/seckill/result?status=fail')
```

## API 接口

### 前端 Composable

```javascript
// composables/seckill.js

// 获取秒杀活动列表（含场次信息）
export function useSeckillActivityApi(query = {}) {
  return useHttpGet('SeckillActivity', '/seckill/activity/list', {
    query,
    lazy: true,
  })
}

// 获取某场次的秒杀商品列表
export function useSeckillGoodsListApi(sessionId, query = {}) {
  return useHttpGet('SeckillGoodsList', `/seckill/goods/list`, {
    query: { sessionId, ...query },
    lazy: true,
  })
}

// 获取秒杀商品详情
export function useSeckillGoodsDetailApi(id) {
  return useHttpGet('SeckillGoodsDetail', `/seckill/goods/detail/${id}`, {
    lazy: true,
  })
}

// 获取服务端当前时间戳（用于倒计时校准）
export function useSeckillServerTimeApi() {
  return useHttpGet('SeckillServerTime', '/seckill/server-time')
}

// 创建秒杀订单（复用 order.js 中的 flashsale 分支）
// useCreateOrderApi(body, 'flashsale') → POST /order/flashsale
```

### 后端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/pc/seckill/activity/list` | 获取活动列表及场次 |
| `GET` | `/pc/seckill/goods/list` | 获取场次商品列表，支持 `sessionId`、`type`、`category` 筛选 |
| `GET` | `/pc/seckill/goods/detail/{id}` | 获取秒杀商品详情 |
| `GET` | `/pc/seckill/server-time` | 获取服务端时间戳（毫秒） |
| `POST` | `/pc/order/flashsale` | 创建秒杀订单（已有，锁定名额） |
| `POST` | `/pc/order/wxpay` | 发起微信支付（复用现有） |
| `POST` | `/pc/order/iswxpay` | 查询支付状态（复用现有） |

## 数据结构

### 秒杀活动对象

```javascript
{
  id: Number,           // 活动 ID
  title: String,        // 活动标题，如"安全生产知识大促"
  banner: String,       // Banner 图片 URL
  start_time: String,   // 活动开始时间
  end_time: String,     // 活动结束时间
  sessions: [           // 场次列表
    {
      id: Number,
      name: String,     // 场次名称，如"10:00 场"
      start_time: String,
      end_time: String,
      status: String,   // 'pending' | 'active' | 'ended'
    }
  ]
}
```

### 秒杀商品对象

```javascript
{
  id: Number,             // 秒杀商品 ID
  goods_id: Number,       // 原始商品 ID（课程/电子书/题库）
  goods_type: String,     // 'course' | 'book' | 'exam'
  session_id: Number,     // 所属场次 ID
  title: String,          // 商品名称
  cover: String,          // 封面图 URL
  seckill_price: Number,  // 秒杀价（元）
  original_price: Number, // 原价（元）
  quota: Number,          // 总名额（0 表示不限量）
  sold_count: Number,     // 已售数量
  teacher_name: String,   // 讲师姓名（网课）
  teacher_avatar: String, // 讲师头像
  rating: Number,         // 讲师评分（0-5）
  student_count: Number,  // 学员数
  good_rate: Number,      // 好评率（0-100）
  // 网课专属
  lesson_count: Number,   // 课时数
  valid_days: Number,     // 有效天数（0 表示永久）
  // 电子书专属
  page_count: Number,     // 页数
  format: String,         // 格式，如 'PDF'
  author: String,         // 作者
  // 题库专属
  question_count: Number, // 题目数
  pass_rate: Number,      // 通过率（0-100）
  // 购买状态（需登录后返回）
  is_purchased: Boolean,  // 是否已购买
  limit_per_user: Number, // 每人限购数量（0 表示不限）
}
```

### 秒杀订单请求体

```javascript
// POST /pc/order/flashsale
{
  goods_id: Number,       // 秒杀商品 ID（seckill goods id）
  type: 'flashsale',      // 固定值
  session_id: Number,     // 场次 ID
}
```

### 抢购结果页参数（URL Query）

```javascript
// 成功：/seckill/result?status=success&title=xxx&price=xxx&expire=xxx&order_no=xxx
// 失败：/seckill/result?status=fail
{
  status: 'success' | 'fail',
  title: String,    // 商品名称
  price: String,    // 实付金额
  expire: String,   // 有效期描述，如"永久有效"或"365天"
  order_no: String, // 订单号
}
```

## 倒计时实现说明

秒杀倒计时必须基于服务端时间，不能依赖客户端本地时间，防止用户修改系统时间作弊。

```javascript
// 推荐实现方式（在页面 setup 中）
const { data: serverTime } = await useSeckillServerTimeApi()

// 计算客户端与服务端的时间差（毫秒）
const timeDiff = serverTime.value.timestamp - Date.now()

// 计算目标时间距"服务端现在"的剩余毫秒数
const getRemaining = (targetTimestamp) => {
  return targetTimestamp - (Date.now() + timeDiff)
}

// 传给 CountDown 组件时，传入修正后的结束时间戳
// <CountDown :time="correctedEndTime" />
const correctedEndTime = Date.now() + timeDiff + getRemaining(session.end_time)
```

现有 `CountDown.vue` 组件接受 `time` prop（时间戳或日期字符串），可直接复用。

## 名额进度条实现

```javascript
// 进度百分比
const progress = computed(() => {
  if (!goods.quota || goods.quota === 0) return 0 // 不限量不显示进度条
  return Math.min(Math.round((goods.sold_count / goods.quota) * 100), 100)
})

// 进度条文案
const progressText = computed(() => {
  if (!goods.quota || goods.quota === 0) return ''
  return `已抢 ${progress.value}% 名额`
})

// 剩余名额
const remaining = computed(() => {
  if (!goods.quota || goods.quota === 0) return Infinity
  return goods.quota - goods.sold_count
})
```

## 按钮状态逻辑

```javascript
// 按钮状态枚举
const BtnState = {
  PENDING: 'pending',     // 场次未开始
  ACTIVE: 'active',       // 可抢购
  SOLD_OUT: 'sold_out',   // 名额已满
  PURCHASED: 'purchased', // 已购买
}

const btnState = computed(() => {
  if (goods.is_purchased) return BtnState.PURCHASED
  if (session.status === 'pending') return BtnState.PENDING
  if (session.status === 'ended') return BtnState.SOLD_OUT
  if (goods.quota > 0 && goods.sold_count >= goods.quota) return BtnState.SOLD_OUT
  return BtnState.ACTIVE
})

// 按钮文案
const btnText = computed(() => {
  switch (btnState.value) {
    case BtnState.PURCHASED: return '去学习'
    case BtnState.PENDING:   return `${countdown} 后开抢`
    case BtnState.SOLD_OUT:  return `¥${goods.original_price} 原价购买`
    case BtnState.ACTIVE:    return '立即抢购'
  }
})
```

## 组件复用建议

| 现有组件/Composable | 在秒杀模块中的用途 |
|--------------------|--------------------|
| `components/CountDown.vue` | 场次倒计时、价格恢复倒计时 |
| `components/Course/CourseOutline.vue` | 详情页课程大纲折叠展示 |
| `components/Price.vue` | 价格展示（秒杀价/原价） |
| `components/Loading/CourseSkeleton.vue` | 商品卡片骨架屏 |
| `composables/order.js` → `useCreateOrderApi(body, 'flashsale')` | 创建秒杀订单 |
| `composables/order.js` → `useWxpayApi(no)` | 发起微信支付 |
| `composables/order.js` → `useGetWxpayStatusApi(no)` | 轮询支付状态 |
| `composables/order.js` → `useGetGoodsInfoApi(id, type)` | 获取商品基础信息 |
| `pages/pay.vue` | 微信支付页（直接复用，无需修改） |
| `middleware/auth.js` | 抢购前登录校验 |

## 文件结构

```
pages/
  seckill/
    index.vue           # 秒杀活动首页
    detail/
      [id].vue          # 秒杀商品详情
    result.vue          # 抢购结果页

composables/
  seckill.js            # 秒杀相关 API Composable

components/
  Seckill/
    GoodsCard.vue       # 秒杀商品卡片（首页列表用）
    SessionTabs.vue     # 场次 Tab 切换
    QuotaBar.vue        # 名额进度条
    CountdownBadge.vue  # 倒计时徽章（卡片右上角）
```

## 注意事项

1. **服务端时间校准**：页面加载时必须请求 `/seckill/server-time`，计算本地与服务端的时间差，所有倒计时基于修正后的时间运行，防止客户端时间不准导致提前/延迟开抢。

2. **名额已满不消失**：名额售罄后，抢购按钮变为 `¥xxx 原价购买`，点击跳转至普通购买流程（`/createorder?id=xxx&type=course`），不能直接隐藏按钮，避免流量损失。

3. **已购用户处理**：接口返回 `is_purchased: true` 时，按钮显示 `去学习`，点击跳转至课程学习页，不再走支付流程。

4. **下单对齐现有 order.js**：创建秒杀订单直接调用 `useCreateOrderApi(body, 'flashsale')`，内部已路由到 `/order/flashsale`，无需新增 Composable。

5. **支付页复用**：秒杀下单成功后，直接 `navigateTo('/pay?no=xxx')` 复用现有微信支付页，支付成功后由 `pay.vue` 跳转至 `/user/buy/1`，或在秒杀场景下改为跳转 `/seckill/result?status=success&...`（需在 `pay.vue` 中增加来源判断，或在 result 页通过订单号查询结果）。

6. **商品类型差异化**：`goods_type` 为 `course` / `book` / `exam`，卡片和详情页根据类型条件渲染不同字段（课时数/页数/题目数），避免硬编码。

7. **筛选参数传递**：首页筛选栏的 `type`（商品类型）和 `category`（分类）作为 query 参数传给 `useSeckillGoodsListApi`，切换时重新请求，不做前端过滤。

8. **骨架屏**：商品列表加载时使用 `CourseSkeleton` 组件占位，避免布局抖动。

9. **登录拦截**：点击抢购按钮前检查登录状态，未登录跳转 `/login?redirect=/seckill/detail/xxx`，可复用 `middleware/auth.js`。

10. **限购校验**：`limit_per_user > 0` 时，前端在按钮旁展示"每人限购 N 件"说明，实际限购由后端 `/order/flashsale` 接口校验并返回错误信息。

## 开发计划

- [ ] 创建 `composables/seckill.js`，封装秒杀相关 API
- [ ] 实现 `components/Seckill/GoodsCard.vue` 商品卡片组件
- [ ] 实现 `components/Seckill/SessionTabs.vue` 场次 Tab 组件
- [ ] 实现 `components/Seckill/QuotaBar.vue` 名额进度条组件
- [ ] 实现 `pages/seckill/index.vue` 秒杀首页
- [ ] 实现 `pages/seckill/detail/[id].vue` 商品详情页
- [ ] 实现 `pages/seckill/result.vue` 抢购结果页
- [ ] 对接服务端时间戳，校准倒计时
- [ ] 联调 `/order/flashsale` 下单接口
- [ ] 联调微信支付流程
