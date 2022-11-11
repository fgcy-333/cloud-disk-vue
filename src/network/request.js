import axios from 'axios';
import qs from 'qs'
import {getToken} from '@/utils/auth'
import store from '@/store'

export function request(url, params, method, type) {

    const instance = axios.create({
        baseURL: '/disk',
        timeout: 5000,
        withCredentials: true,
    })

    // axios请求拦截器
    instance.interceptors.request.use(
        //请求前带token
        config => {
            if (store.getters.token) {
                config.headers['token'] = getToken()
            }
            return config
        },
        error => {
            console.log(error) // for debug
            return Promise.reject(error)
        });


    instance.interceptors.response.use(
        resp => {
            return resp.data;
        }
        ,
        error => {
            console.log("全局拦截相应异常", error)
            return error;
        }
    );


    if (type !== 'json') {
        return instance.request({
            url,
            data: params,
            method: method
        })
    } else {
        return instance.request({
            url,
            data: params,
            method: method,
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
        })
    }

    /*    if (method && method == 'post') {
            if (type && type == "params") {
                if (params) {
                    // return instance.post(url, params)
                    if (header == 'json') {
                        return instance.request({
                            url,
                            data: params,
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json;charset=UTF-8'
                            },
                        })
                    } else if (type == 'paramsSerializer') {
                        return instance.request({
                            url,
                            data: qs.stringify(params, {arrayFormat: 'repeat'}),
                            method: 'post',
                        })
                    } else {
                        return instance.request({
                            url,
                            data: params,
                            method: 'post',
                        })
                    }
                } else {
                    return instance.post(url)
                }
            } else {
                // resful的形式
                if (params) {
                    for (var key in params) {
                        // 拼接url
                        url = url + '/' + params[key];
                    }
                }
                return instance.post(url);
            }
        } else if (!method || method == 'get') {
            if (type == 'resful' || !type) {
                // resful的形式
                if (params) {
                    for (var key in params) {
                        // 拼接url
                        url = url + '/' + params[key];
                    }
                }
                return instance.get(url);
            } else if (type == 'params') {
                // console.log(params);
                params = {
                    params: params
                }
                return instance.get(url, params)
            }
        } else if (method && method == 'put') {
            if (params) {
                return instance.put(url, params)
            } else {
                return instance.put(url)
            }
        } else if (method && method == 'delete') {
            // resful的形式
            if (params) {
                for (var key in params) {
                    // 拼接url
                    url = url + '/' + params[key];
                }
            }
            return instance.delete(url);
        }*/
}