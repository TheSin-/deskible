$(function() {
	$.deskible.start({
		storage: 'session', // session or local
		theme: 'default',
		authentication: 'auth.txt',
		taskbarSnap: 'bottom', // top, bottom, left or right
		desktopColor: '#000000', // hex values only
		wallpaperScale: 'fill', // actual, fit, fill, stretch, tile
		wallpaperPosition: 'center center', 
		wallpaperURL: 'resources/wallpapers/field-nature.jpg',
		wallpapersLocal: [
			'resources/wallpapers/binary-wormhole.jpg',
			'resources/wallpapers/field-nature.jpg',
			'resources/wallpapers/moonlight-night.jpg',
			'resources/wallpapers/pulse-map.jpg',
			'resources/wallpapers/red-autumn.jpg',
			'resources/wallpapers/wet-stone.jpg',
		],
		changePassURL: 'changepass.json',
		startMenu: [{
			icon: 'book',
			label: 'Documentation',
			sub: [{
				icon: 'wrench',
				id: 'docu-setup',
				label: 'Setup and Layout',
				options: {
					tabs: false,
					content: {
						url: 'apps/documentation/setup.html'
					}
				}
			}, {
				icon: 'cubes',
				id: 'docu-api',
				label: 'API',
				options: {
					tabs: false,
					content: {
						url: 'apps/documentation/api.html'
					}
				}
			}, {
				icon: 'external',
				id: 'docu-plugins',
				label: 'External Projects',
				options: {
					tabs: false,
					content: {
						url: 'apps/documentation/plugins.html'
					}
				}
			}]
		}, {
			icon: 'idea',
			label: 'Examples',
			sub: [{
				icon: 'file text outline',
				id: 'example-text',
				label: 'Text Window',
				options: {
					tabs: false,
					content: {
						url: 'apps/examples/text.html'
					}
				}
			}, {
				icon: 'grid layout',
				id: 'example-grid',
				label: 'Grid Window',
				options: {
					tabs: false,
					content: {
						url: 'apps/examples/grid.html'
					}
				}
			}, {
				icon: 'film',
				id: 'example-video',
				label: 'Video Window',
				options: {
					tabs: false,
					overflow: 'hidden',
					size: {
						width: 650,
						height: 490
					},
					content: {
						url: 'apps/examples/video.html'
					}
				}
			}]
		}, {
			icon: 'announcement',
			id: 'about',
			label: 'About',
			options: {
				tabs: false,
				size: {
					width: 750,
					height: 500
				},
				content: {
					url: 'apps/about/index.html',
				}
			}
		}]
	});
});
