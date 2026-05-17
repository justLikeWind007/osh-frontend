// Course payment APIs.
//
// These wrap the new /pc/course/pay/* endpoints exposed by CoursePayController.
// They live in a separate file from order.js on purpose: the legacy order.js still
// drives /order/wxpay and /order/iswxpay, which we are intentionally NOT touching.

// Create a course payment order and get the QR code string.
//   body: { course_id: Number, pay_type: "wxpay" | "alipay" }
//   returns { data, error } where data.value = { qrcode, payurl, out_trade_no, pay_type }
export function useCoursePayCreateApi(body) {
    return useHttpPost("CoursePayCreate", "/course/pay/create", {
        body
    })
}

// Poll the payment status. The $:true mode bypasses useFetch caching so each tick
// hits the server fresh, mirroring how useGetWxpayStatusApi handles polling.
//   out_trade_no: String returned from useCoursePayCreateApi
//   returns { data, error } where data.value = { paid: true | false }
export function useCoursePayStatusApi(out_trade_no) {
    return useHttpGet(
        "CoursePayStatus",
        `/course/pay/status?out_trade_no=${encodeURIComponent(out_trade_no)}`,
        { $: true }
    )
}
