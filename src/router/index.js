import Vue from 'vue'
import VueRouter from 'vue-router'
import vuexIndex from '@/store/index.js'
import {getToken} from '@/utils/auth'

const Index = () => import('views/index.vue')
const Files = () => import('views/files/Files.vue')
const Albums = () => import('views/albums/Albums.vue')
const Collectes = () => import('views/collectes/Collectes.vue')
const Login = () => import('views/login/Login.vue')


const routes = [
    {path: '/', redirect: '/index'},

    {
        path: '/index',
        component: Index,
        redirect: '/files/%2Froot',
        children: [
            {path: '/files', redirect: '/files/%2Froot'},
            {path: '/files/:path', name: 'files', component: Files},
            {path: '/albums', component: Albums},
            {path: '/collectes', component: Collectes},
        ]
    },
    {path: '/login', component: Login},
]

Vue.use(VueRouter)


const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})


//登录判断 没有用户信息强制返回登录界面
//全局路由守卫
/*router.beforeEach((to, from, next) => {
    if (to.path != '/login' && !getToken()) {
        router.replace('/login')
    } else {
        next();
    }
})*/

export default router
