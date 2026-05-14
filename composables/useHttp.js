import {
    createDiscreteApi
} from "naive-ui"
import { handleAuthExpired } from "~/composables/useAuth"

// 自动检测环境并设置API地址
function getBaseURL() {
    // 服务端渲染时使用默认地址
    if (process.server) {
        return "http://localhost:8081/pc"
    }
    
    // 客户端根据hostname判断
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return "http://localhost:8081/pc"
    } else {
        return "http://43.242.200.25:8081/pc"
    }
}

export const fetchConfig = {
    baseURL: getBaseURL(),
    headers:{
        appid:"bd9d01ecc75dbbaaefce"
    },
}

function isAuthExpiredError(err){
    const payload = err?.data || {}
    const msg = payload?.msg || payload?.data || err?.message || ''
    const code = payload?.code

    return code === 401
        || code === 3100
        || code === 3101
        || /认证失败/.test(msg)
        || /登录已过期/.test(msg)
        || /用户未登录/.test(msg)
        || /请先登录/.test(msg)
}

function resolveToken() {
    // 优先 cookie，兼容已有逻辑
    let tokenValue = ""
    try {
        tokenValue = useCookie("token").value || ""
    } catch (e) {}

    // 客户端兜底 localStorage
    if (!tokenValue && process.client) {
        tokenValue = localStorage.getItem("token") || localStorage.getItem("Token") || ""
    }

    return tokenValue
}

function useGetFetchOptions(options = {}){
    options.baseURL = options.baseURL ?? fetchConfig.baseURL
    options.headers = options.headers ?? {
        appid:fetchConfig.headers.appid
    }
    options.initialCache = options.initialCache ?? false
    options.lazy = options.lazy ?? false

    // 用户登录默认带鉴权头，兼容不同后端读取方式
    const tokenValue = resolveToken()
    if(tokenValue){
        options.headers.token = tokenValue
        options.headers.Authorization = `Bearer ${tokenValue}`
    }

    return options
}

export async function useHttp(key,url,options = {}){
    options = useGetFetchOptions(options)
    options.key = key
    if(options.$){
        const data = ref(null)
        const error = ref(null)
        console.log(options)
        return await $fetch(url,options).then(res=>{
            data.value = res.data
            return {
                data,
                error
            }
        }).catch(err=>{
            const msg = err?.data?.data
            if(process.client && isAuthExpiredError(err)){
                // 统一走登录失效处理，避免业务页只看到“保存失败”。
                handleAuthExpired(null, err?.data?.msg || msg || '登录已过期，请重新登录')
                return {
                    data,
                    error
                }
            }
            if(process.client){
                const { message } = createDiscreteApi(["message"])
                message.error(msg || '服务端错误')
            }
            error.value = msg
            return {
                data,
                error
            }
        })
    }

    let res = await useFetch(url,{
        ...options,
        // 相当于响应拦截器
        transform:(res)=>{
            return res.data
        },
    })

    // 客户端错误处理
    if(process.client && res.error.value){
        const errData = res.error.value?.data
        const msg = errData?.data || errData?.msg
        if(isAuthExpiredError(res.error.value)){
            // useFetch 和 $fetch 两条链路都要兜住，否则页面行为会不一致。
            handleAuthExpired(null, errData?.msg || msg || '登录已过期，请重新登录')
            return res
        }
        if(!options.lazy){
            const { message } = createDiscreteApi(["message"])
            message.error(msg || '服务端错误')
        }
    }

    return res
}

// GET请求
export function useHttpGet(key,url,options = {}){
    options.method = "GET"
    return useHttp(key,url,options)
}

// POST请求
export function useHttpPost(key,url,options = {}){
    options.method = "POST"
    return useHttp(key,url,options)
}
