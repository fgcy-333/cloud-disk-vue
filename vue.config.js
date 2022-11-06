module.exports = {
    configureWebpack: {
        resolve: {
            alias: {
                'assets': '@/assets',
                'common': '@/common',
                'components': '@/components',
                'network': '@/network',
                'views': '@/views',
                'plugins': '@/plugins',
            }
        }
    },
    devServer: {
        proxy: {
            '/disk': {
                target: 'http://localhost:9001',
                changeOrigin: true,
                ws: true,
            },
            // '/downloadfile': {
            //     target: 'https://chen110.oss-cn-guangzhou.aliyuncs.com',
            //     changeOrigin: true,
            //     ws: true,
            //     pathRewrite: {
            //         '^/downloadfile': ''
            //     }
            // },
            // '/downloadvideo': {
            //     target: 'https://outin-cefd5d83abc511ebb0a800163e1a625e.oss-cn-shanghai.aliyuncs.com',
            //     changeOrigin: true,
            //     ws: true,
            //     pathRewrite: {
            //         '^/downloadvideo': ''
            //     }
            // },

        }
    }
}