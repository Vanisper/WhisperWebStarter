declare module 'vue' {
	export interface ComponentCustomProperties {
		vPermission?: typeof import('./permission')['default'];
	}
}

export {};