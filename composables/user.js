// 登录
export function useLoginApi(body) {
    return useHttpPost("login", "/user/login", {
        // body: body ES6简化写法
        body
    })
}

// appid注册
export function useRegApi(uniqueId) {
    return useHttpPost("reg", "/user/register/verity", {
        body: {
            uniqueId
        }
    })
}

// 获取用户信息用来保证user全局生效
export function useGetinfoApi() {
    return useHttpGet("getinfo", "/user/getinfo", {
        $: true
    })
}

// 退出登录
export function useLogoutApi() {
    return useHttpPost("logout", "/user/logout")
}

// 获取邮箱uniqueId
export function useGetCaptchaApi(email, username, password, repassword) {
    return useHttpPost("GetCaptcha", "/user/register/submit", {
        body: {
            email,
            username,
            password,
            repassword
        }
    })
}

// 绑定手机号
// export function useBindPhoneApi(body){
//     return useHttpPost("bindphone","/bind_mobile",{
//         body
//     })
// }

// 忘记密码
export function useForgetApi(body) {
    return useHttpPost("forget", "/user/forget", {
        body
    })
}

// 获取学习记录
export function useUserHistoryApi(query) {
    return useHttpGet("userHistory", () => {
        let q = useQueryToString(query())
        console.log("user.js 获取学习记录" + q)
        return `/user_history/list${q}`
    }, {
        lazy: true
    })
}

// 获取购买记录
export function useOrderListApi(page) {
    return useHttpGet("OrderList", `/order/list?page=${page}`, {
        lazy: true
    })
}

// 我的考试记录
export function useUserTestApi(page) {
    return useHttpGet("UserTest", `/user_test/list?page=${page}`, {
        lazy: true
    })
}

// 我的帖子列表
export function useMypostListApi(page) {
    return useHttpGet("MypostList", `/mypost?page=${page}`, {
        lazy: true
    })
}


// 获取优惠券记录
export function useUserCouponApi(page) {
    return useHttpGet("UserCoupon", `/user_coupon?page=${page}`, {
        lazy: true
    })
}

// 我的收藏列表
export function useMyFavaListApi(page) {
    return useHttpGet("MyFavaList", `/user_fava?page=${page}`, {
        lazy: true
    })
}

// 取消收藏
export function useUncollectApi(body) {
    return useHttpPost("Uncollect", "/uncollect", {
        body
    })
}

// 收藏
export function useCollectApi(body) {
    return useHttpPost("collect", "/collect", {
        body
    })
}

// 修改资料（avatar、nickname、sex）
export function useUpdateUserInfoApi(body) {
    return useHttpPost("updateUserInfo", "/user/update_info", {
        body
    })
}

// 上传图片
export function useUploadConfig() {
    const token = useCookie("token")
    return {
        action: fetchConfig.baseURL + "/upload",
        headers: {
            appid: fetchConfig.headers.appid,
            token: token.value,
            "Authorization": token.value
        }
    }
}

// 修改密码
export function useupdatePasswordApi(body) {
    return useHttpPost("updatePassword", "/user/update_password", {
        body
    })
}

// 改绑邮箱 - 提交请求（发送验证邮件）
export function useChangeEmailSubmitApi(body) {
    return useHttpPost("changeEmailSubmit", "/user/changeEmail/submit", {
        body
    })
}

// 改绑邮箱 - 验证 uniqueId
export function useChangeEmailVerityApi(body) {
    return useHttpPost("changeEmailVerity", "/user/changeEmail/verity", {
        body
    })
}

// 注销账号
export function useDeleteUserApi() {
    return useHttpPost("deleteUser", "/user/deleteUser")
}

// 领取优惠券
export function useReceiveUserCouponApi(body) {
    return useHttpPost("receiveUserCoupon", "/user_coupon/receive", {
        body
    })
}

export function useListAllUserApi() {
    return useHttpGet("ListAllUser", '/user/all', {
        $: true
    })
}