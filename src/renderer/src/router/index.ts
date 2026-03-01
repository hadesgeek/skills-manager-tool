import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/skills-manager'
    },
    {
        path: '/skills-manager',
        name: 'SkillsManager',
        component: () => import('@renderer/views/SkillsManager.vue')
    },
    {
        path: '/skill-editor',
        name: 'SkillEditor',
        meta: { hideSidebar: true },
        component: () => import('@renderer/views/SkillEditor.vue')
    },
    {
        path: '/tools',
        name: 'Tools',
        component: () => import('@renderer/views/Tools.vue')
    },
    {
        path: '/market',
        name: 'Market',
        component: () => import('@renderer/views/Market.vue')
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@renderer/views/Settings.vue')
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
