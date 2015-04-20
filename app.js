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
			icon: 'world',
			label: 'Realms and Providers',
			sub: [{
				icon: 'privacy',
				label: 'Access Providers',
				url: ''
			}, {
				icon: 'world',
				label: 'Realms',
				url: ''
			}]
		}, {
			icon: 'life ring',
			label: 'NAS Devices',
			sub: [{
				icon: 'life ring',
				label: 'NAS Devices',
				url: ''
			}, {
				icon: 'tags',
				label: 'NAS Device tags',
				url: ''
			}]
		}, {
			icon: 'users',
			label: 'Profiles',
			sub: [{
				icon: 'user',
				label: 'Profile Components',
				url: ''
			}, {
				icon: 'users',
				label: 'Profiles',
				url: ''
			}]
		}, {
			icon: 'configure',
			label: 'Tools',
			sub: [{
				icon: 'heartbeat',
				label: 'Activity Monitor',
				url: ''
			}, {
				icon: 'lightning',
				label: 'RADIUS Client',
				url: ''
			}, {
				icon: 'file text outline',
				label: 'Logfile viewer',
				url: ''
			}, {
				icon: 'bug',
				label: 'Debug output',
				url: ''
			}, {
				icon: 'translate',
				label: 'Translation manager',
				url: ''
			}, {
				icon: 'privacy',
				label: 'Rights manager',
				url: ''
			}]
		}, {
			icon: 'sun',
			label: 'Finances',
			sub: [{
				icon: 'tags',
				label: 'Payment Plans',
				url: ''
			}, {
				icon: 'shop',
				label: 'Paypal',
				url: ''
			}, {
				icon: 'shop',
				label: 'PayU',
				url: ''
			}, {
				icon: 'shop',
				label: 'Authorize.Net',
				url: ''
			}, {
				icon: 'shop',
				label: 'MyGate',
				url: ''
			}, {
				icon: 'shop',
				label: 'Premium SMS',
				url: ''
			}]
		}, {
			icon: 'user',
			label: 'Permanent Users',
			sub: [{
				icon: 'user',
				label: 'Permanent Users',
				url: ''
			}, {
				icon: 'tablet',
				label: 'BYOD Manager',
				url: ''
			}, {
				icon: 'coffee',
				label: 'Top-ups',
				url: ''
			}]
		}, {
			icon: 'lock',
			label: 'Dynamic Firewalls',
			sub: [{
				icon: 'unlock alternate',
				label: 'Dynamic Firewall Components',
				url: ''
			}, {
				icon: 'lock',
				label: 'Dynamic Firewalls',
				url: ''
			}]
		}, {
			icon: 'ticket',
			label: 'Vouchers',
			url: ''
		}, {
			icon: 'ticket',
			label: 'Vouchers 2',
			url: ''
		}, {
			icon: 'share alternate',
			label: 'MESHdesk',
			url: ''
		}, {
			icon: 'share alternate',
			label: 'MESHdesk 2',
			url: ''
		}, {
			icon: 'sun',
			label: 'Finances',
			sub: [{
				icon: 'tags',
				label: 'Payment Plans',
				url: ''
			}, {
				icon: 'shop',
				label: 'Paypal',
				url: ''
			}, {
				icon: 'shop',
				label: 'PayU',
				url: ''
			}, {
				icon: 'shop',
				label: 'Authorize.Net',
				url: ''
			}, {
				icon: 'shop',
				label: 'MyGate',
				url: ''
			}, {
				icon: 'shop',
				label: 'Premium SMS',
				url: ''
			}]
		}, {
			icon: 'qrcode',
			label: 'Dynamic login pages',
			url: ''
		}, {
			icon: 'qrcode',
			label: 'Dynamic login pages 2',
			url: ''
		}]
	});
});
