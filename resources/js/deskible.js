(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}(function($) {
	'use strict';
	$.extend({
		/*jshint supernew:true */
		deskible: new function() {
			var di = this;

			di.version = '0.0.1';
			di.started = false;

			var defaults = {
				'theme': 'default',
				'authentication': false,
				'taskbarSnap': 'bottom',
				'desktopColor': '#000000',
				'wallpaperScale': 'fit',
				'wallpaperPosition': 'center center',
				'wallpaperURL': 'resources/wallpapers/field-nature.jpg',
				'wallpapersLocal': [
					'resources/wallpapers/binary-wormhole.jpg',
					'resources/wallpapers/field-nature.jpg',
					'resources/wallpapers/moonlight-night.jpg',
					'resources/wallpapers/pulse-map.jpg',
					'resources/wallpapers/red-autumn.jpg',
					'resources/wallpapers/wet-stone.jpg',
				],
				'changePassURL': '',
				'startMenu': {},

				'storage': 'session',
				'debug': false
			},
			    config = {},
			    windows = {};

			/* private methods */
			function loadSemantic() {
				$('head').prepend($('<link/>', {
					'rel': 'stylesheet',
					'type': 'text/css',
					'href': 'plugins/semantic/dist/semantic.min.css'
				}));

				$('head').append($('<script/>', {
					'src': 'plugins/semantic/dist/semantic.min.js'
				}));
			}

			function formatTime() {
				var d = new Date();

				var hours = d.getHours();
				var minutes = d.getMinutes();
				var seconds = d.getSeconds();
				var milliseconds = d.getMilliseconds();
				var cycle = " AM";
				var sep = ":";

				if (hours > 11) {
					cycle = " PM";
					if (hours > 12) {
						hours = hours - 12;
					}
				}

				if (minutes < 10) {
					minutes = '0' + minutes;
				}

				if (seconds < 10) {
					seconds = '0' + seconds;
				}

				return hours + sep + minutes + cycle;
			}

			function startTime() {
				setInterval(function() {
					$('#deskible-taskbar-clock').text(formatTime());
				}, 500);
			}

			function desktopDimentions() {
				var d = $('.deskible-windows-desktop').offset();
				d.width = $('.deskible-windows-desktop').width();
				d.height = $('.deskible-windows-desktop').height();

				return d;
			}

			function cascadeWindows() {
				var i,
				    zIndexes = [],
				    coloffset = 0,
				    d = desktopDimentions(),
				    top = 0,
				    left = 0,
				    space = parseInt($('.deskible-window-handle:first').outerHeight()) + parseInt($('.deskible-window:first').css('padding-top')) + 3;

				// build z-Index array
				$('.deskible-window:visible').not('.deskible-window-infopane').each(function() {
					var $this = $(this);

					zIndexes.push({
						$el: $this,
						z: $this.css('z-index')
					});
				});

				// Sort
				zIndexes.sort(function(a,b) {
					return a.z > b.z ? 1 : a.z < b.z ? -1 : 0;
				});

				for (i = 0; i < zIndexes.length; i++) {
					zIndexes[i].$el.css({
						'top': top,
						'left': left
					});

					saveWindow(zIndexes[i].$el.attr('data-id'));

					top += space;
					left += space;

					if (top >= (top + d.height) ||
					    left >= (left + d.width)) {
						coloffset += space * 4;
						top = 0;
						left = coloffset;
					}
				}
			}

			function tileWindows() {
				var d = desktopDimentions();

				// FIXME
				alert('Window tiling coming soon!');
			}

			function recenterWindow(id) {
				var d = desktopDimentions();
			}

			function setActiveTask() {
				$('.deskible-task').removeClass('active');
				if ($('.deskible-window').not('.deskible-window-minimized').length > 0) {
					var order = layerOrder(windows, 'layer');
					if (order.length == 0) {
						return;
					}
					var wid = 0;

					for(var i = order.length - 1; i >= 0; i--) {
						if (typeof order[i] === 'object') {
							if (!$('#window-' + order[i].id).hasClass('deskible-window-minimized')) {
								wid = order[i].wid;
								break;
							}
						}
					}

					if ($('.deskible-taskbar-inner').length > 0) {
						$('#task-' + windows[wid].id).addClass('active');
					}
				}
			}

			function minWindow(id) {
				var $window = $('#window-' + id);
				var wid = $window.attr('data-wid');
				var $task = $('#task-' + id);
				var task = $task.offset();
				task.w = $task.width();
				task.h = $task.height();

				saveWindow(id);

				$window.addClass('deskible-window-minimized');
				di.windows(wid, true, 'minimized');
				$window.addClass('animated ' + config.minAni);

				setActiveTask();
			}

			function sizeWindow($window, size) {
				$window.offset({
					'top': size.top,
					'left': size.left
				});

				$window.width(size.width);
				$window.height(size.height);
			}

			function restoreWindow(id) {
				var $window = $('#window-' + id);
				var wid = $window.attr('data-wid');

				if ($window.hasClass('deskible-window-minimized')) {
					$window.removeClass('deskible-window-minimized');
					di.windows(wid, false, 'minimized');
					$window.show().addClass('animated ' + config.resAni);
				} else {
					var w = loadWindow(id);
					sizeWindow($window, w);
					if ($window.hasClass('deskible-window-maximized')) {
						$window.removeClass('deskible-window-maximized');
						di.windows(wid, false, 'maximized');
						$window.find('.deskible-window-restore').hide();
						$window.find('.deskible-window-maximize').show();
					}
				}

				$('.deskible-task').removeClass('active');
				$('#task-' + id).addClass('active');
			}

			function maxWindow(id) {
				var d = desktopDimentions();
				var $window = $('#window-' + id);
				var wid = $window.attr('data-wid');

				d.width = '100%';
				d.height = '100%';

				saveWindow(id);
				sizeWindow($window, d);
				$window.addClass('deskible-window-maximized');
				di.windows(wid, true, 'maximized');

				$window.find('.deskible-window-maximize').hide();
				$window.find('.deskible-window-restore').show();
			}

			function loadWindow(id) {
				var $window = $('#window-' + id);
				var top = $window.attr('data-top');
				var left = $window.attr('data-left');
				var width = $window.attr('data-width');
				var height = $window.attr('data-height');

				if (!$window.hasClass('deskible-window-maximized')) {
					$window.removeAttr('data-top');
					$window.removeAttr('data-left');
					$window.removeAttr('data-width');
					$window.removeAttr('data-height');
				}

				return {
					'top': top,
					'left': left,
					'width': width,
					'height': height
				};
			}

			function saveWindow(id) {
				var $window = $('#window-' + id);
				var wid = $window.attr('data-wid');
				if ($window.hasClass('deskible-window-maximized')) {
					return;
				}

				var w = $window.offset();
				w.width = $window.width();
				w.height = $window.height();
				$window.attr('data-top', w.top);
				$window.attr('data-left', w.left);
				$window.attr('data-width', w.width);
				$window.attr('data-height', w.height);

				windows[wid].position.top = w.top;
				windows[wid].position.left = w.left;
				windows[wid].size.width = w.width;
				windows[wid].size.height = w.height;

				storage('windows', windows);
			}

			function showSettings(tab) {
				if (typeof tab === 'undefined') {
					tab = 'desktop';
				}

				var opts =  {
					'resizable': true,
					'size': {
						'width': 500,
						'height': 400
					},
					'tabs': true,
					'title': 'Settings',
					'icon': 'settings',
					'content': []
				};

				var active = false;
				if (tab == 'desktop') {
					active = true;
				}
	
				opts.content.push({
					'desktop': {
						'tablabel': 'Desktop',
						'active': active,
						'url': 'resources/forms/settings-desktop.html',
						'loads': function(c, $w, di) {
							$w.find('select[name=wallpaperScale]').val(c.wallpaperScale);
							$w.find('select[name=wallpaperPosition]').val(c.wallpaperPosition);
							$w.find('input[name=wallpaperURL]').closest('div.ui.input').css('width', '100%');
							$w.find('input[name=wallpaperURL]').val(c.wallpaperURL);
							di.imagePicker($w.find('.deskible-imagePicker'), c.wallpapersLocal, c.wallpaperURL);
							$w.find('.deskible-colorSelector div').css('background-color', c.desktopColor);
							$w.find('.deskible-colorSelector').ColorPicker({
								'color': c.desktopColor,
								'onChange': function(hsb, hex, rgb) {
									$w.find('.deskible-colorSelector div').css('background-color', '#' + hex);
									$w.find('.deskible-imagePicker div').css('background-color', '#' + hex);
									di.setBackgroundColor('#' + hex);
								}
							});
						},
						'binds': {
							'syssettings-wallpaperScale': {
								'on': 'change',
								'func': function(e, $ele, di) {
									di.setWallpaperScale($ele.val());
								}
							},
							'syssettings-wallpaperPosition': {
								'on': 'change',
								'func': function(e, $ele, di) {
									di.setWallpaperPosition($ele.val());
								}
							},
							'syssettings-wallpaperURL': {
								'on': 'change',
								'func': function(e, $ele, di) {
									di.setWallpaper($ele.val());
								}
							}
						}
					}
				});

				active = false;
				if (tab == 'taskbar') {
					active = true;
				}

				opts.content.push({
					'taskbar': {
						'tablabel': 'Taskbar',
						'active': active,
						'url': 'resources/forms/settings-taskbar.html',
						'loads': function(c, $w, di) {
							$w.find('select[name=taskbarSnap]').val(c.taskbarSnap);
						},
						'binds': {
							'syssettings-taskbarSnap': {
								'on': 'change',
								'func': function(e, $ele, di) {
									di.setTaskbarSnap($ele.val());
								}
							}
						}
					}
				});

				di.makeWindow('syssettings', opts);
			}

			function buildStartMenu() {
				$('body').append($('<div/>', {
					'class': 'deskible-startmenu deskible-menu deskible-hidden'
				}).append($('<div/>', {
					'class': 'deskible-startmenu-header'
				}).append($('<i/>', {
					'class': 'icon user deskible-startmenu-usericon'
				})).append($('<div/>', {
					'class': 'deskible-startmenu-userlabel'
				}).text('Administrator::root'))).append($('<div/>', {
					'class': 'deskible-startmenu-menu'
				})).append($('<div/>', {
					'class': 'deskible-startmenu-toolbar'
				})));

				var $toolbar = $('.deskible-startmenu-toolbar'); 

				if (config.authentication !== false) {
					$toolbar.append($('<div/>', {
						'id': 'deskible-logout',
						'class': 'ui labeled icon mini fluid button',
					}).text('Logout').prepend($('<i/>', {
						'class': 'icon power'
					}))).append($('<div/>', {
						'class': 'deskible-startmenu-toolbar-separator'
					}));
				}

				$toolbar.append($('<div/>', {
					'id': 'deskible-settings',
					'class': 'ui labeled icon mini fluid button',
				}).text('Settings').prepend($('<i/>', {
					'class': 'icon settings'
				})));

				if (config.authentication !== false) {
					$toolbar.append($('<div/>', {
						'class': 'deskible-startmenu-toolbar-space'
					})).append($('<div/>', {
						'id': 'deskible-password',
						'class': 'ui labeled icon mini fluid button',
					}).text('Password').prepend($('<i/>', {
						'class': 'icon lock'
					})));
				}

				populateStartMenu();

				$('#deskible-settings').on('click', function() {
					$('.deskible-viewport').trigger('closeall');

					showSettings();
				});

				if (config.authentication !== false) {
					$('#deskible-logout').on('click', function() {
						$('.deskible-viewport').trigger('closeall');
						logout();
					});

					$('#deskible-password').on('click', function() {
						$('.deskible-viewport').trigger('closeall');

						di.makeWindow('syspassword', {
							'resizable': false,
							'tabs': false,
							'title': 'Change Password',
							'icon': 'privacy',
							'content': {
								'url': 'resources/forms/changepass.html',
								'binds': {
									'syspassword-change': {
										'on': 'submit',
										'func': function(e, $ele, di) {
	e.preventDefault();
	di.changePassword($ele);
										}
									}
								}
							}
						});
					});
				}
			}

			function populateStartMenu() {
				$('.deskible-startmenu-menu').append($('<ul/>'));
				var $menu = $('.deskible-startmenu-menu ul');
				var menuid = 1000;
				var submenues = [];
				var maxx = $(window).outerHeight();

				$.each(config.startMenu, function(k, v) {
					menuid++;

					$menu.append($('<li/>', {
						'id': 'deskible-startmenu-' + menuid,
						'class': 'deskible-startmenu-item',
						'data-menuid': menuid
					}).append($('<i/>', {
						'class': 'icon ' + v.icon
					})).append($('<span/>').text(v.label)));

					if (typeof v.sub === 'object') {
						submenues.push(menuid);
						$('#deskible-startmenu-' + menuid).append($('<i/>', {
							'class': 'icon caret right'
						}));

						$('#deskible-startmenu-' + menuid).append($('<ul/>', {
							'class': 'deskible-menu-sub deskible-menu'
						}));

						var $submenu = $('#deskible-startmenu-' + menuid + ' ul');
						var subid = 0;
						$.each(v.sub, function(kk, vv) {
							subid++;
							$submenu.append($('<li/>', {
								'id': 'deskible-startmenu-' + menuid + '-' + subid,
								'class': 'deskible-startmenu-subitem deskible-link',
								'data-url': vv.url
							}).append($('<i/>', {
								'class': 'icon ' + vv.icon
							})).append($('<span/>').text(vv.label)));

							$('#deskible-startmenu-' + menuid + '-' + subid).on('click', function(e) {
								var opts = vv.options;
								opts.title = vv.label;
								opts.icon = vv.icon;
								di.makeWindow(vv.id, opts);
							});
						});
					} else {
						$('#deskible-startmenu-' + menuid).addClass('deskible-link');
						$('#deskible-startmenu-' + menuid).on('click', function(e) {
							var opts = v.options;
							opts.title = v.label;
							opts.icon = v.icon;
							di.makeWindow(v.id, opts);
						});
					}
				});

				setTimeout(function() {
					// Make sure we aren't out of the window
					$.each(submenues, function(k, menuid) {
						var $submenu = $('#deskible-startmenu-' + menuid + ' ul');
						var subpos = $submenu.offset();
						var subbottom = subpos.top + $submenu.outerHeight();
						var diff = subbottom - maxx;

						if (diff > 0) {
							$submenu.css({
								'top': '-' + (parseInt(diff) + 40) + 'px',
							});
						}
					});

					$('.deskible-link').on('click', function() {
						$('.deskible-viewport').trigger('closeall');
					});

					$('.deskible-viewport').on('closeall', function() {
						if (!$('.deskible-startmenu').hasClass('deskible-hidden')) {
							$('.deskible-startbutton').trigger('click');
						}

						$('.deskible-menu').not('.deskible-startmenu').not('.deskible-hidden').addClass('deskible-hidden');

						// FIXME submenus don't close on click
						setTimeout(function() {
							$('.deskible-menu-sub').removeClass('deskible-hidden');
						}, 1000);
					});

					// Make sure everything is moved before
					// we enable the startbutton
					$('.deskible-startbutton').on('click', function(e) {
						// Use visibility so offset and size work
						// even when hidden
						if ($('.deskible-startmenu').hasClass('deskible-hidden')) {
							$('.deskible-startmenu').removeClass('deskible-hidden');
							$('.deskible-startbutton').addClass('active');
						} else {
							$('.deskible-startmenu').addClass('deskible-hidden');
							$('.deskible-startbutton').removeClass('active');
						}
						//$('.deskible-startbutton').toggleClass('active');
						//$('.deskible-startmenu').toggle();
					});

					$('.deskible-startbutton').removeClass('disabled');
				}, 250);
			}

			function showLogin() {
				di.makeWindow('syslogin', {
					'type': 'infopane',
					'tabs': false,
					'resizable': false,
					'closable': false,
					'position': {
						'top': '200px',
						'left': 'center'
					},
					'zindex': 16777271,
					'title': 'Login',
					'icon': 'privacy',
					'content': {
						'url': 'resources/forms/login.html',
						'binds': {
							'syslogin-login': {
								'on': 'submit',
								'func': function(e, $ele, di) {
	e.preventDefault();
	di.auth($ele);
								}
							}
						}
					}
				});
			}

			function storage(field, value) {
				var ret;

				// FIXME functions aren't storing at all

				if (typeof value === 'object' ||
				    typeof value === 'array') {
					value = JSONfn.stringify(value);
				}

				if (config.storage == 'local') {
					ret = locStorage(field, value);
				} else {
					ret = sessStorage(field, value);
				}

				if (ret == 'true') {
					return true;
				} else if (ret == 'false') {
					return false;
				} else {
					var json = false;
					try {
						json = JSONfn.parse(ret);
					} catch (e) {
						json = false;
					}

					if (typeof json === 'object' &&
					    json != null) {
						return json;
					} else {
						return ret;
					}
				}
			}

			function sessStorage(field, value) {
				if (typeof value !== 'undefined') {
					if (value === null) {
						sessionStorage.removeItem(field);
						return;
					}
					sessionStorage.setItem(field, value);
				}

				return sessionStorage.getItem(field);
			}

			function locStorage(field, value) {
				if (typeof value !== 'undefined') {
					if (value === null) {
						localStorage.removeItem(field);
						return;
					}
					localStorage.setItem(field, value);
				}

				return localStorage.getItem(field);
			}

			function logout() {
				storage('loggedin', false);
				storage('username', null);
				storage('password', null);
				storage('windows', null);
				storage('config', null);

				location.reload();
			}

			di.auth = function($ele) {
				var $content = $ele.closest('.deskible-window-content');
				var user = $content.find('#syslogin-username').val();
				var pass = $content.find('#syslogin-password').val();
				$.get(config.authentication, {
					'username': user,
					'password': pass
				}, function(data) {
					if ($.trim(data) == 'AuthOK') {
						storage('loggedin', true);
						storage('username', user);
						storage('password', pass);
						di.closeWindow(-1, 'syslogin');
						completeDesktop();
					} else {
						$content.find('#syslogin-password').val('');
						if (!data) {
							data = 'Credentials invalid';
						}
						di.notification(data, 'error');
					}
				}, 'text');
			};

			di.changePassword = function($ele) {
				var $content = $ele.closest('.deskible-window-content');

				var currentpass = $content.find('#syspassword-current').val();
				var newpass = $content.find('#syspassword-new').val();
				var confirmpass = $content.find('#syspassword-confirm').val();

				$.get(config.changePassURL, {
					'current': currentpass,
					'new': newpass,
					'confirm': confirmpass
				}, function(data) {
					var json = false;
					try {
						json = $.parseJSON(data);
					} catch (e) {
						json = false;
					}

					if (typeof json === 'object' &&
					    json != null) {
						di.notification(json.notification, json.type);
					} else {
						di.notification(data);
					}

					$content.find('#syspassword-current').val('');
					$content.find('#syspassword-new').val('');
					$content.find('#syspassword-confirm').val('');
				}, 'text');
			};

			function loadProfile() {
			}

			di.setBackgroundColor = function(color) {
				di.config('desktopColor', color);
				$('div.deskible-desktop').css('background-color', color);
			};

			di.setWallpaper = function(url) {
				di.config('wallpaperURL', url);
				var cssurl = 'url(' + url + ')';

				if (url == 'none' || url == '') {
					cssurl = 'none';
				}

				$('.deskible-wallpaper').css('background-image', cssurl);
			};

			di.setWallpaperScale = function(scale) {
				var size = 'auto';
				var repeat = 'no-repeat';

				if (scale == 'stretch') {
					size = '100% 100%';
				} else if (scale == 'fill') {
					size = 'cover';
				} else if (scale == 'fit') {
					size = 'contain';
				} else if (scale == 'tile') {
					repeat = 'repeat';
				}

				di.config('wallpaperScale', scale);
				$('.deskible-wallpaper').css('background-size', size);
				$('.deskible-wallpaper').css('background-repeat', repeat);
			};

			di.setWallpaperPosition = function(position) {
				di.config('wallpaperPosition', position);
				$('.deskible-wallpaper').css('background-position', position);
			};

			di.setTaskbarSnap = function(snap) {
				var $windows = $('#deskible-windows');
				var $desktop = $('.deskible-desktop');
				var $notifications = $('#deskible-notifications');
				var $taskbar = $('.deskible-taskbar');
				var $startmenu = $('.deskible-startmenu');
				var $dock = $taskbar.find('.deskible-taskbar-dock');

				$.each($('.deskible-window-infopane'), function(k, pane) {
					var id = $(pane).attr('id').replace(/^window-/, '');
					di.closeWindow(-1, id);
				});

				if (config.taskbarSnap !== snap) {
					$taskbar.removeClass('deskible-taskbar-' + config.taskbarSnap);
					$startmenu.removeClass('deskible-startmenu-' + config.taskbarSnap);
				}

				di.config('taskbarSnap', snap);

				$windows.css({
					'top': 0,
					'left': 0,
					'padding-top': 0,
					'padding-bottom': 0,
					'padding-left': 0,
					'padding-right': 0
				});

				$desktop.css({
					'top': 0,
					'left': 0,
					'padding-top': 0,
					'padding-bottom': 0,
					'padding-left': 0,
					'padding-right': 0
				});

				$notifications.css({
					'margin-top': 0,
				});

				$startmenu.css({
					'top': 'auto',
					'left': 'auto',
					'bottom': 'auto',
					'right': 'auto'
				});

				$dock.css('width', '');
				$dock.css('height', '');

				$('.deskible-taskbar-dock-scroll-prev i').removeClass('left');
				$('.deskible-taskbar-dock-scroll-prev i').removeClass('up');
				$('.deskible-taskbar-dock-scroll-next i').removeClass('right');
				$('.deskible-taskbar-dock-scroll-next i').removeClass('down');

				$taskbar.addClass('deskible-taskbar-' + snap);
				$startmenu.addClass('deskible-startmenu-' + snap);

				setTimeout(function() {
					var th = $taskbar.outerHeight();
					var tw = $taskbar.outerWidth();
					if (snap == 'bottom') {
						di.config('minAni', 'fadeOutDownBig');
						di.config('resAni', 'fadeInUpBig');
						$windows.css({
							'top': 0,
							'left': 0,
							'padding-bottom': th + 'px'
						});
						$desktop.css({
							'top': 0,
							'left': 0,
							'padding-bottom': th + 'px'
						});
						$('.deskible-taskbar-dock-scroll-prev i').addClass('left');
						$('.deskible-taskbar-dock-scroll-next i').addClass('right');
						$startmenu.css({
							'bottom': th,
							'left': 0
						});
						$dock.css('width', 'auto');
						addScrolling('.deskible-taskbar-dock-tasks', '.deskible-taskbar-dock-tasks-container', '.deskible-taskbar-dock-scroll-prev', '.deskible-taskbar-dock-scroll-next');
					} else if (snap == 'top') {
						di.config('minAni', 'fadeOutUpBig');
						di.config('resAni', 'fadeInDownBig');
						$windows.css({
							'top': 0,
							'left': 0,
							'padding-top': th + 'px'
						});
						$desktop.css({
							'top': 0,
							'left': 0,
							'padding-top': th + 'px'
						});
						$notifications.css({
							'margin-top': th + 'px',
						});
						$('.deskible-taskbar-dock-scroll-prev i').addClass('left');
						$('.deskible-taskbar-dock-scroll-next i').addClass('right');
						$startmenu.css({
							'top': th,
							'left': 0
						});
						$dock.css('width', 'auto');
						addScrolling('.deskible-taskbar-dock-tasks', '.deskible-taskbar-dock-tasks-container', '.deskible-taskbar-dock-scroll-prev', '.deskible-taskbar-dock-scroll-next');
					}
				}, 100);
			};

			function buildTaskbar() {
				$('.deskible-taskbar').append($('<div/>', {
					'class': 'deskible-taskbar-inner'
				}).append($('<div/>', {
					'class': 'deskible-taskbar-startbutton'
				}).append($('<div/>', {
					'class': 'ui blue tiny button disabled deskible-startbutton'
				}).text('Menu').prepend($('<i/>', {
					'class': 'icon content'
				})))).append($('<div/>', {
					'class': 'deskible-taskbar-divider'
				})).append($('<div/>', {
					'class': 'deskible-taskbar-dock',
					'css': {
						'white-space': 'nowrap'
					}
				}).append($('<div/>', {
					'class': 'deskible-taskbar-dock-scroll deskible-taskbar-dock-scroll-prev ui button icon disabled',
					'css': {
						'visibility': 'hidden'
					}
				}).append($('<i/>', {
					'class': 'icon chevron'
				}))).append($('<div/>', {
					'class': 'deskible-taskbar-dock-tasks',
					'css': {
						'position': 'relative',
						'overflow': 'hidden',
						'white-space': 'nowrap'
					}
				}).append($('<div/>', {
					'class': 'deskible-taskbar-dock-tasks-container'
				}))).append($('<div/>', {
					'class': 'deskible-taskbar-dock-scroll deskible-taskbar-dock-scroll-next ui button icon',
					'css': {
						'visibility': 'hidden'
					}
				}).append($('<i/>', {
					'class': 'icon chevron'
				})))).append($('<div/>', {
					'class': 'deskible-taskbar-divider'
				})).append($('<div/>', {
					'class': 'deskible-taskbar-tasks'
				}).append($('<span/>', {
					'id': 'deskible-taskbar-clock'
				}))));

				startTime();
				buildStartMenu();
				di.setTaskbarSnap(config.taskbarSnap);

				$(window).resize(function() {
					var maxwidth = $(window).width();
					var $taskbar = $('.deskible-taskbar');
					var $taskbarcontainer = $taskbar.find('.deskible-taskbar-dock-tasks');

					var dockwidth = maxwidth - $taskbar.find('.deskible-taskbar-startbutton').outerWidth(true) - $taskbar.find('.deskible-taskbar-tasks').outerWidth(true) - (2 * $taskbar.find('.deskible-taskbar-divider').outerWidth(true)) - $taskbar.find('.deskible-taskbar-dock-scroll-next').outerWidth(true) - $taskbar.find('.deskible-taskbar-dock-scroll-prev').outerWidth(true);

					$taskbarcontainer.css({
						'width': dockwidth,
						'max-width': dockwidth
					});

					if ($taskbar.find('.deskible-taskbar-dock-tasks-container').outerWidth() > dockwidth) {
						$taskbar.find('.deskible-taskbar-dock-scroll').css('visibility', 'visible');
					} else {
						$taskbar.find('.deskible-taskbar-dock-scroll').css('visibility', 'hidden');
					}

					scrollingAnimation($taskbarcontainer, $taskbarcontainer);
				});

				$('body').on('click keyup', function(e) {
					// only listen for esc key
					if (e.type == 'keyup' && e.keyCode !== 27) {
						return;
					}

					// Let startbutton do it's thang
					if ($(e.target).closest('.deskible-taskbar-startbutton').length > 0) {
						return;
					}

					// Click was on a menu
					if ($(e.target).closest('.deskible-menu').length > 0) {
						return;
					}

					if (!$('.deskible-startmenu').hasClass('deskible-hidden')) {
						$('.deskible-startbutton').trigger('click');
					}

					$('.deskible-contextualmenu').remove();
					$('.deskible-menu').not('.deskible-menu-sub').not('.deskible-hidden').addClass('deskible-hidden');
				});

				$('body').on('click keyup', function(e) {
					if ($('#window-sysdatetime').length > 0) {
						if ($(e.target).closest('#window-sysdatetime').length > 0) {
							return;
						}
						if ($(e.target).closest('.deskible-taskbar-tasks').length == 0) {
							di.closeWindow(-1, 'sysdatetime');
						}
					}
				});

				$('.deskible-taskbar-tasks').on('click', function(e) {
					e.preventDefault();
					if ($('#window-sysdatetime').length > 0) {
						di.closeWindow(-1, 'sysdatetime');
						return;
					}

					var position = {
						'right': 2,
						'bottom': 2
					};

					if (config.taskbarSnap == 'top') {
						position = {
							'right': 2,
							'top': 2
						};
					}

					di.makeWindow('sysdatetime', {
						'type': 'infopane',
						'handle': false,
						'tabs': false,
						'position': position,
						'overflow': 'visible',
						'title': 'Date and Time',
						'icon': 'calendar',
						'zindex': 16777271
					});

					var $sysdatetime = $('#window-sysdatetime').find('.deskible-window-content');

					var day = [
						'Sunday',
						'Monday',
						'Tuesday',
						'Wednesday',
						'Thursday',
						'Friday',
						'Saturday'
					];

					var date = new Date();
					var datestr = day[date.getDay()] + ', ' + date.toLocaleDateString();

					$sysdatetime.append($('<div/>', {
						'class': 'deskible-datetime-fulldate'
					}).text(datestr)).append($('<div/>', {
						'class': 'deskible-datetime-pane',
						'id': 'deskible-datetime-cal'
					})).append($('<div/>', {
						'class': 'deskible-datetime-pane',
						'id': 'deskible-datetime-clock'
					}));

					var pickerdate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
					$('.deskible-datetime-fulldate').on('click', function() {
						$('#deskible-datetime-cal').DatePickerSetDate(pickerdate, true);
					});

					$('#deskible-datetime-cal').DatePicker({
						'flat': true,
						'date': pickerdate,
						'current': pickerdate,
						'format': 'Y-m-d',
						'calendars': 1,
						'starts': 0
					});

					var $clockpane = $sysdatetime.find('#deskible-datetime-clock');

					$clockpane.append($('<ul/>', {
						'id': 'deskible-clock'
					}).append($('<li/>', {
						'id': 'deskible-sec'
					})).append($('<li/>', {
						'id': 'deskible-min'
					})).append($('<li/>', {
						'id': 'deskible-hour'
					})).append($('<li/>', {
						'id': 'deskible-time'
					})));

					updateClock();
					di.clock = setInterval(function() {
						updateClock();
					}, 1000);
					
				});

				$('.deskible-taskbar').on('contextmenu', function(e) {
					e.preventDefault();
					e.stopPropagation();

					var menu = [{
						'type': 'item',
						'icon': 'tasks',
						'title': 'Taskbar Settings...',
						'callback': function() {
							showSettings('taskbar');
						}
					}];

					buildContextualMenu(menu, e);
				});

				$('.deskible-task').on('contextmenu', function(e) {
					e.preventDefault();
					e.stopPropagation();
					// FIXME
					alert('contextual menu popup');
				});
			}

			// FIXME need a way to destroy these without removing the elements.
			function addScrolling(ele, content, buttonL, buttonR) {
				var $ele = $(ele),
				    $buttonL = $(buttonL),
				    $buttonR = $(buttonR),
				    buttons = buttonL + ', ' + buttonR;
				$ele.data('buttonL', buttonL);
				$ele.data('buttonR', buttonR);
				$ele.data('content', content);
				$buttonL.data('ele', ele);
				$buttonR.data('ele', ele);

				// event handling for buttons "left", "right"
				$(buttons).on('mousedown', function (e) {
					var $ele = $($(this).data('ele'));
					$ele.data('scroll', true);
					scrollingAnimation($ele, $(this));
				}).on('mouseup mouseout', function (e) {
					var $ele = $($(this).data('ele'));
					$ele.data('scroll', false).stop();
				});

				// event handling for mouse drag
				$ele.mousedown(function (e) {
					$(this).data('down', true)
						.data('x', e.clientX)
						.data('scrollLeft', this.scrollLeft);
					return false;
				}).mouseup(function (e) {
					$(this).data('down', false);
				}).mousemove(function (e) {
					if ($(this).data('down')) {
						this.scrollLeft = $(this).data('scrollLeft') + $(this).data('x') - e.clientX;
						scrollingAnimation($(this), $(this));
					}
				}).css({
					'overflow': 'hidden'
				});
			}

			function scrollingAnimation($ele, $btn) {
				var aniTime = 10,
				    step = 5;

				var scrollLeft = 0;
				if (typeof $ele[0].scrollLeft !== 'undefined') {
					scrollLeft = $ele[0].scrollLeft;
				}

				if (scrollLeft > 0) {
					$($ele.data('buttonL')).removeClass('disabled');
				} else {
					$($ele.data('buttonL')).addClass('disabled');
				}
				if ((scrollLeft + $ele.width()) >= $($ele.data('content')).outerWidth()) {
					$($ele.data('buttonR')).addClass('disabled');
				} else {
					$($ele.data('buttonR')).removeClass('disabled');
				}

				if ($btn.hasClass('disabled')) {
					return false;
				}

				var dir = $btn.is($ele.data('buttonR'));

				if ($ele.data('scroll')) {
					var sign = (dir) ? step : -step;
					$ele[0].scrollLeft += sign;
					setTimeout(function () {
						scrollingAnimation($ele, $btn)
					}, aniTime);
				}

				return false;
			}

			function updateClock() {
				var date = new Date();

				var seconds = date.getSeconds();
				var sdegree = seconds * 6;

				var minutes = date.getMinutes();
				var mdegree = minutes * 6;

				var hours = date.getHours();
				var hdegree = hours * 30 + (minutes / 2);

				$('#deskible-sec').css({
					'transform': 'rotate(' + sdegree + 'deg)',
					'-webkit-transform': 'rotate(' + sdegree + 'deg)',
					'-moz-transform': 'rotate(' + sdegree + 'deg)',
					'-ms-transform': 'rotate(' + sdegree + 'deg)',
					'-o-transform': 'rotate(' + sdegree + 'deg)'
				});
				$('#deskible-min').css({
					'transform': 'rotate(' + mdegree + 'deg)',
					'-webkit-transform': 'rotate(' + mdegree + 'deg)',
					'-moz-transform': 'rotate(' + mdegree + 'deg)',
					'-ms-transform': 'rotate(' + mdegree + 'deg)',
					'-o-transform': 'rotate(' + mdegree + 'deg)'
				});
				$('#deskible-hour').css({
					'transform': 'rotate(' + hdegree + 'deg)',
					'-webkit-transform': 'rotate(' + hdegree + 'deg)',
					'-moz-transform': 'rotate(' + hdegree + 'deg)',
					'-ms-transform': 'rotate(' + hdegree + 'deg)',
					'-o-transform': 'rotate(' + hdegree + 'deg)'
				});
				$('#deskible-time').text(date.toLocaleTimeString());
			}

			function buildDesktop() {
				var layout = $('<div/>', {
					'class': 'deskible-viewport'
				}).append($('<div/>', {
					'class': 'deskible-desktop'
				}).append($('<div/>', {
					'class': 'deskible-wallpaper'
				})).append($('<div/>', {
					'class': 'deskible-taskbar'
				})));

				setTheme(config.theme);
				$('body').prepend(layout);

				$('body').append($('<div/>', {
					'id': 'deskible-menus',
				})).append($('<div/>', {
					'id': 'deskible-windows',
				}).append($('<div/>', {
					'id': 'deskible-notifications'
				})).append($('<div/>', {
					'class': 'deskible-windows-desktop'
				})));

				di.setBackgroundColor(config.desktopColor);
				di.setWallpaper(config.wallpaperURL);
				di.setWallpaperScale(config.wallpaperScale);
				di.setWallpaperPosition(config.wallpaperPosition);

				if (config.authentication !== false && storage('loggedin') !== true) {
					showLogin();
				} else {
					completeDesktop();
				}
			}

			function completeDesktop() {
				buildTaskbar();
				loadProfile();

				$('.deskible-windows-desktop').on('contextmenu', function(e) {
					var menu = [{
						'type': 'item',
						'icon': 'desktop',
						'title': 'Change Desktop Background...',
						'callback': function() {
							showSettings('desktop');
						}
					}, {
						'type': 'separator'
					}];

					var disabled = true;
					if ($('.deskible-dragable').length > 0) {
						var disabled = false;
					}

					menu.push({
						'type': 'item',
						'icon': 'block layout',
						'title': 'Tile',
						'callback': function() {
							tileWindows();
						},
						'disabled': disabled
					});

					menu.push({
						'type': 'item',
						'icon': 'copy',
						'title': 'Cascade',
						'callback': function() {
							cascadeWindows();
						},
						'disabled': disabled
					});

					buildContextualMenu(menu, e);
				});
			}

			function layerOrder(obj, field) {
				var i, arr = [], newobj = {};

				for (i in obj) {
					arr.push(obj[i]);
				}

				arr.sort(function(a, b) {
					var x = a[field],
					    y = b[field];

					return x > y ? 1 : x < y ? -1 : 0;
				});

				return arr;
			}

			function buildContextualMenu(menu, e) {
				e.preventDefault();
				e.stopPropagation();
				var $menu = $('<div/>', {
					'class': 'deskible-menu deskible-contextualmenu',
					'css': {
						'visibility': 'hidden'
					}
				}).append($('<ul/>'));

				var item = 0;
				var callbacks = [];
				$.each(menu, function(k, v) {
					if (v.type == 'item') {
						item++;
						var css = {
							'data-item': item
						};

						if (typeof v.disabled !== 'undefiend') {
							if (v.disabled === true) {
								css['class'] = 'deskible-contextualmenu-disabled';
							}
						}
						var $li = $('<li/>', css).text(v.title).prepend($('<i/>', {
							'class': 'icon ' + v.icon
						}));
						callbacks.push(v.callback);

						$menu.find('ul').append($li);
					} else if (v.type == 'separator') {
						$menu.find('ul').append($('<hr/>', {
							'class': 'deskible-contextualmenu-separator'
						}));
					}
				});

				$('.deskible-contextualmenu').remove();
				$('body').append($menu);

				for(var i = 0; i < callbacks.length; i++) {
					var item = i + 1;
					if (callbacks[i] && $.isFunction(callbacks[i])) {
						$('.deskible-contextualmenu ul li[data-item=' + item + ']').on('click', function() {
							var cid = parseInt($(this).attr('data-item')) - 1;
							if ($(this).hasClass('deskible-contextualmenu-disabled')) {
								return false;
							}

							callbacks[cid]();

							$('.deskible-contextualmenu').remove();
							return false;
						});
					}
				}

				var w = $('.deskible-contextualmenu').outerWidth();
				var h = $('.deskible-contextualmenu').outerHeight();

				var css = {
					'visibility': 'visible'
				};

				if (e.pageY + h > $(window).height()) {
					css.top = e.pageY - h;
				} else {
					css.top = e.pageY;
				}

				if (e.pageX + w > $(window).width()) {
					css.left = e.pageX - w;
				} else {
					css.left = e.pageX;
				}

				$('.deskible-contextualmenu').css(css);
			}

			function buildTab(id, tid, content, closable) {
				if (typeof closable === 'undefined') {
					closable = false;
				}

				var $tabs = $('#window-' + id).find('.deskible-window-tabs ul');

				if ($tabs.find('li[data-tid=' + tid + ']').length > 0) {
					$tabs.find('li[data-tid=' + tid + ']').trigger('click');
					return;
				}

				var css = {
					'data-tid': tid
				};

				if (content.active === true) {
					css['class'] = 'deskible-tab-active';
				}

				var $tab = $('<li/>', css).text(content.tablabel);
				if (closable === true) {
					$tab.append($('<div/>', {
						'class': 'ui icon button circular mini deskible-tab-close'
					}).append($('<i/>', {
						'class': 'icon remove'
					})));
				}

				$tabs.append($tab);

				if (closable === true) {
					$tabs.find('li[data-tid=' + tid + '] .deskible-tab-close').on('click', function() {
						
						var $tab = $tabs.find('li[data-tid=' + tid + ']');
						$tab.prev().trigger('click');
						$tab.remove();
						$('#window-' + id).find('.deskible-tab-content[data-tid=' + tid + ']').remove();
					});
				}
			}

			di.buildContent = function(id, tid, content, closable) {
				var $content = $('#window-' + id).find('.deskible-window-content');
				var $container = false;

				if (tid !== false) {
					$content.append($('<div/>', {
						'data-tid': tid,
						'class': 'deskible-tab-content'
					}));
					$container = $content.find('.deskible-tab-content[data-tid=' + tid + ']');
					buildTab(id, tid, content, closable);
				}

				$.get(content.url, function(data) {
					if ($container !== false) {
						$container.html(data);
					} else {
						$content.html(data);
					}

					if (content.loads && $.isFunction(content.loads)) {
						content.loads(config, $('#window-' + id), di);
					}

					if (typeof content.binds !== 'undefined') {
						$.each(content.binds, function(bid, bind) {
							$('#' + bid).on(bind.on, function(e) {
								bind.func(e, $(this), di);
							});
						});
					}
				}, 'html');

				if ($container !== false && content.active !== true) {
					$container.hide();
				}
			};

			di.imagePicker = function($container, images, selected) {
				for (var i = 0; i < images.length; i++) {
					var url = 'url(' + images[i] + ')';

					if (images[i] == 'none' || images[i] == '') {
						url = 'none';
					}

					var $image = $('<div/>', {
						'data-url': images[i],
						'css': {
							'background-image': url,
							'background-color': config.desktopColor,
							'background-repeat': 'no-repeat',
							'background-size': 'contain',
							'background-position': 'center center'
						}
					}).on('click', function(e) {
						var url = $(this).attr('data-url');
						var inputID = $container.attr('data-inputid');

						$container.find('div').removeClass('deskible-image-active');
						$(this).addClass('deskible-image-active');

						$container.closest('.deskible-window-content').find('#' + inputID).val(url).trigger('change');
					});

					if (images[i] == selected) {
						$image.addClass('deskible-image-active');
					}

					$container.append($image);
				}
			};

			function dragable(wid, $container) {
				// FIXME constrain to deskible-windows-desktop
				// Allow past (left,right,down) but only till
				// 90px of window is avail
				var $selected = null;
				var $handle = $container.find('.deskible-window-handle');

				$handle.on('mousedown', function(e) {
					if (e.button != 0 ||
					    $(e.target).closest('.deskible-window-controls').length > 0) {
						return;
					}

					reorderWindows(wid);
					$selected = $container;

					var drg_h = $selected.outerHeight(true),
					    drg_w = $selected.outerWidth(true),
					    pos_y = $selected.offset().top + drg_h - e.pageY,
					    pos_x = $selected.offset().left + drg_w - e.pageX;

					$(document).on('mousemove', function(e) {
						if (!$container.hasClass('deskible-dragging')) {
							$container
								.addClass('deskible-dragging')
								.fadeTo('fast', 0.5)
								.find('.deskible-window-content')
								.css('visibility', 'hidden');
						}

						$selected.offset({
							top: e.pageY + pos_y - drg_h,
							left: e.pageX + pos_x - drg_w
						});
					}).on('mouseup', function() {
						$(this).off('mousemove');
						$selected = null;
					});
					e.preventDefault();
				}).on('mouseup', function(e) {
					if (!$container.hasClass('deskible-dragging')) {
						return;
					}

					$selected = null;

					$container
						.removeClass('deskible-dragging')
						.fadeTo('fast', 1)
						.find('.deskible-window-content')
						.css('visibility', 'visible');

					if (typeof di.windows(wid) !== 'undefined') {
						di.windows(wid, $container.offset(), 'position');
					}
				});
			}

			function resizable(wid, $container) {
				// FIXME constrain to deskible-windows-desktop
				var getDirection = function(e) {
					var dir = '';
					var o = $container.offset();
					var w = $container.outerWidth();
					var h = $container.outerHeight();
					var edge = 10;

					if (e.pageY > o.top && e.pageY < o.top + edge) {
						dir += 'n';
					} else {
						if (e.pageY < o.top + h && e.pageY > o.top + h - edge) {
							dir += 's';
						}
					}

					if (e.pageX > o.left && e.pageX < o.left + edge) {
						dir += 'w';
					} else {
						if (e.pageX > o.left && e.pageX > o.left + w - edge) {
							dir += 'e';
						}
					}

					return dir;
				};

				var parseCSS = function(css) {
					var val = parseInt($container.css(css));

					if (isNaN(val)) {
						return 0;
					} else {
						return val;
					}
				};

				var _data = {};
				var minWidth = parseCSS('min-width') || 0;
				var minHeight = parseCSS('min-height') || 0;
				var maxWidth = parseCSS('max-width') || 10000;
				var maxHeight = parseCSS('max-height') || 10000;
				var resize = function(e) {
					if (_data.dir.indexOf('e') != -1) {
						_data.width = _data.startWidth + e.pageX - _data.startX;
						_data.width = Math.min(Math.max(_data.width, minWidth), maxWidth);
					}
					if (_data.dir.indexOf('s') != -1) {
						_data.height = _data.startHeight + e.pageY - _data.startY;
						_data.height = Math.min(Math.max(_data.height, minHeight), maxHeight);
					}
					if (_data.dir.indexOf('w') != -1) {
						_data.width = _data.startWidth - e.pageX + _data.startX;
						_data.width = Math.min(Math.max(_data.width, minWidth), maxWidth);
						_data.left = _data.startLeft + _data.startWidth - _data.width;
					}
					if (_data.dir.indexOf('n') != -1) {
						_data.height = _data.startHeight - e.pageY + _data.startY;
						_data.height = Math.min(Math.max(_data.height, minHeight), maxHeight);
						_data.top = _data.startTop + _data.startHeight - _data.height;
					}

					$container.css({
						'left': _data.left,
						'top': _data.top
					});

					if ($container.outerWidth() != _data.width) {
						$container.width(_data.width);
					}

					if ($container.outerHeight() != _data.height) {
						$container.height(_data.height);
					}
				};

				var mousemove = function(e) {
					resize(e);

					return false;
				};

				var mouseup = function(e) {
					resize(e);

					$(document).off(".resizable");
					$('body').css("cursor", '');
					$container.css({
						'-webkit-touch-callout': 'initial',
						'-webkit-user-select': 'initial',
						'-khtml-user-select': 'initial',
						'-moz-user-select': 'initial',
						'-ms-user-select': 'initial',
						'user-select': 'initial'
					});
					return false;
				};

				$container.on('mousemove', function(e) {
					var dir = getDirection(e);

					if (dir == '') {
						$container.css('cursor', '');
					} else {
						$container.css('cursor', dir + '-resize');
					}
				}).on('mouseleave', function(e) {
					$container.css('cursor', '');
				}).on('mousedown', function(e) {
					if (e.button != 0) {
						return;
					}

					var dir = getDirection(e);
					if (dir == '') {
						return;
					}

					_data = {
						'target': $container,
						'dir': dir,
						'startLeft': parseCSS('left'),
						'startTop': parseCSS('top'),
						'left': parseCSS('left'),
						'top': parseCSS('top'),
						'startX': e.pageX,
						'startY': e.pageY,
						'startWidth': $container.outerWidth(),
						'startHeight': $container.outerHeight(),
						'width': $container.outerWidth(),
						'height': $container.outerHeight(),
						'deltaWidth': $container.outerWidth() - $container.width,
						'deltaHeight': $container.outerHeight() - $container.height
					};

					$(document).on('mousemove.resizable', _data, mousemove);
					$(document).on('mouseup.resizable', _data, mouseup);
					$('body').css({
						'cursor': dir + '-resize'
					});

					$(this).css({
						'-webkit-touch-callout': 'none',
						'-webkit-user-select': 'none',
						'-khtml-user-select': 'none',
						'-moz-user-select': 'none',
						'-ms-user-select': 'none',
						'user-select': 'none'
					});
				});
			}

			function setTheme(theme) {
				if ($('head').find('#deskibleTheme').length == 0) {
					$('head').append($('<link/>', {
						'id': 'deskibleTheme',
						'rel': 'stylesheet',
					}));
				}

				$('#deskibleTheme').attr('href', 'resources/themes/' + theme + '/deskible.css');
			}

			function reorderWindows(wid) {
				if ($('.deskible-window').length <= 1) {
					return;
				}

				var i, count,
				    w = di.windows();
				var order = layerOrder(w, 'layer');
				var top = parseInt(w[wid].layer);

				count = 0;
				for (var i = 0; i < order.length; i++) {
					var v = order[i];
					if (v.wid != wid) {
						count++;
						if (parseInt(v.layer) > top) {
							var layer = count;
							var zindex = (layer * 10000) + 9000 + parseInt(v.wid);

							$('#window-' + v.id).css('z-index', zindex);
							di.windows(v.wid, layer, 'layer');
							di.windows(v.wid, zindex, 'zindex');
						}
					}
				}

				var layer = count + 1;
				var zindex = (layer * 10000) + 9000 + wid;
				$('#window-' + w[wid].id).css('z-index', zindex);
				di.windows(wid, layer, 'layer');
				di.windows(wid, zindex, 'zindex');
				$('.deskible-task').removeClass('active');
				$('#task-' + w[wid].id).addClass('active');
			}

			/* public methods */
			di.start = function(settings) {
				config = $.extend(true, {}, defaults, settings);

				// if we have a session load it
				var sconfig = storage('config');
				config = $.extend(true, {}, config, sconfig);

				// Save initial settings
				config.startupSettings = settings;

				if (storage('loggedin') === null) {
					storage('loggedin', false);
				}

				// make sure we have no dups
				config.wallpapersLocal = $.unique(config.wallpapersLocal);

				// make sure no wallpaper is avail
				if ($.inArray('none', config.wallpapersLocal) == -1) {
					config.wallpapersLocal.unshift('none');
				}

				storage('config', config);

				if (di.started !== true) {
					// Create the desktop
					buildDesktop();

					// recreate windows if it's a reload
					var openwindows = storage('windows') || {};
					$.each(openwindows, function(wid, winfo) {
						di.makeWindow(winfo.id, winfo);
					});

					setActiveTask();
					setTimeout(function() {
						$(window).resize();
					}, 1000);

					// Make sure we only start once
					di.started = true;
				}
			};

			di.notification = function(text, type) {
				var $notices = $('#deskible-notifications');
				var icon = 'warning sign';
				if (typeof type === 'undefined') {
					type = 'warning';
				}

				if (type == 'error') {
					icon = 'bomb';
				} else if (type == 'notice') {
					icon = 'info circle';
				}

				var $notice = $('<div/>', {
					'class': 'deskible-notification deskible-notification-' + type,
				}).append($('<div/>').text(text)).prepend($('<i/>', {
					'class': 'icon big ' + icon
				}));

				$notices.append($notice);

				$notice.animate({
					'right': '0px'
				}, 'slow');

				var fadeout = setTimeout(function() {
					$notice.animate({
						'right': '-' + $notice.outerWidth(true)
					}, 'slow', function() {
						$(this).remove();
					});
				}, 8000);

				$notice.on('click', function() {
					$notice.animate({
						'right': '-' + $notice.outerWidth(true)
					}, 'slow', function() {
						clearTimeout(fadeout);
						$(this).remove();
					});
				});
			};

			windows = {};
			di.makeWindow = function(id, options) {
				if (typeof id === 'undefined') {
					return;
				}

				if ($('#task-' + id).length > 0) {
					$('#task-' + id).trigger('click');
					return;
				}

				var defaults = {
					'type': 'window',
					'handle': true,
					'resizable': true,
					'dragable': true,
					'closable': true,
					'tabs': true,
					'overflow': 'auto',
					'position': 'center',
					'size': {
						'min-width': 210,
						'min-height': 210,
						'max-width': 10000,
						'max-height': 10000
					},
					'title': 'New Window',
					'icon': 'block layout',
					'zindex': false,
					'layer': false,
					'minimized': false,
					'maximized': false
				};

				var opts = $.extend(true, {}, defaults, options);
				if (opts.handle === false) {
					opts.dragable = false;
					opts.closable = false;
				}

				opts.id = id;

				var zindex = opts.zindex;
				var layer = opts.layer;
				var wid = -1;
				if (opts.type != 'infopane') {
					wid = 0;
					while(windows[wid]) {
						wid++;
					}

					opts.wid = wid;
					di.windows(wid, opts);

					if (layer === false) {
						layer = $('.deskible-window').length + 1;
					}
					di.windows(wid, layer, 'layer');
					if (zindex === false) {
						zindex = (layer * 10000) + 9000 + wid;
					}
					di.windows(wid, zindex, 'zindex');

					var $task = $('<div/>', {
						'class': 'ui button tiny labeled icon active deskible-task',
						'id': 'task-' + id,
						'data-id': id,
						'data-wid': wid,
						'tabindex': '0'
					}).text(opts.title).prepend($('<i/>', {
						'class': 'icon ' + opts.icon
					}));
				}

				var css = $.extend(true, {}, opts.size);
				css['z-index'] = zindex;
				css['visibility'] = 'hidden';
				var $window = $('<div/>', {
					'class': 'deskible-window deskible-window-' + opts.type,
					'id': 'window-' + id,
					'data-id': id,
					'data-wid': wid,
					'tabindex': '-1',
					'css': css,
				}).append($('<div/>', {
					'class': 'deskible-window-pane'
				}).append($('<div/>', {
					'class': 'deskible-window-handle'
				})).append($('<div/>', {
					'class': 'deskible-window-tabs'
				}).append($('<ul/>'))).append($('<div/>', {
					'class': 'deskible-window-content',
					'css': {
						'overflow': opts.overflow
					}
				})));

				if (opts.tabs === false) {
					$window.find('.deskible-window-tabs').hide();
				}

				if (opts.type != 'infopane') {
					$window.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
						if ($(this).hasClass('deskible-window-minimized')) {
							$(this)
								.removeClass(config.minAni)
								.hide();
						} else {
							$(this)
								.removeClass(config.resAni);
							di.windows($window.attr('data-wid'), $window.offset(), 'position');
						}
						$(this).removeClass('animated');
					});
					$window.on('click', function() {
						reorderWindows(wid);
					});
					$window.on('contextmenu', function(e) {
						e.preventDefault();
						e.stopPropagation();
						// FIXME
						alert('window menu coming soon!');
					});
					$task.on('click', function(e) {
						if ($('#window-' + id).is(':visible')) {
							reorderWindows(wid);
						} else {
							restoreWindow(id);
							reorderWindows(wid);
						}
					});
					if (opts.resizable) {
						$task.on('dblclick', function(e) {
							if ($('#window-' + id).is(':visible')) {
								minWindow(id);
							}
						});
					}
					$task.on('contextmenu', function(e) {
						e.preventDefault();
						e.stopPropagation();

						var menu = [];

						var disabled = true;

						if (($('#window-' + id).hasClass('deskible-window-minimized') ||
						    $('#window-' + id).hasClass('deskible-window-maximized')) &&
						    opts.resizable === true) {
							disabled = false;
						}
						menu.push({
							'type': 'item',
							'icon': 'external',
							'title': 'Restore',
							'callback': function() {
								if ($('#window-' + id).hasClass('deskible-window-maximized')) {
									restoreWindow(id);
								} else {
									$('#task-' + id).trigger('click');
								}
							},
							'disabled': disabled
						});

						disabled = true;
						if (!$('#window-' + id).hasClass('deskible-window-minimized') &&
						    opts.resizable === true) {
							disabled = false;
						}
						menu.push({
							'type': 'item',
							'icon': 'compress',
							'title': 'Minimize',
							'callback': function() {
								minWindow(id);
							},
							'disabled': disabled
						});

						disabled = true;
						if (!$('#window-' + id).hasClass('deskible-window-maximized') &&
						    opts.resizable === true) {
							disabled = false;
						}
						menu.push({
							'type': 'item',
							'icon': 'expand',
							'title': 'Maximize',
							'callback': function() {
								maxWindow(id);
							},
							'disabled': disabled
						});

						menu.push({
							'type': 'separator'
						});

						menu.push({
							'type': 'item',
							'icon': 'remove',
							'title': 'Close',
							'callback': function() {
								di.closeWindow(wid, id);
							}
						});

						buildContextualMenu(menu, e);
					});
				}

				var $handle = $window.find('.deskible-window-handle');
				if (opts.handle === true) {
					$handle.append($('<i/>', {
						'class': 'deskible-window-icon icon ' + opts.icon
					})).append($('<span/>', {
						'class': 'deskible-window-title'
					}).text(opts.title)).append($('<div/>', {
						'class': 'deskible-window-controls'
					}));

					if (opts.resizable) {
						$handle.on('dblclick', function(e) {
							minWindow(id);
						});
					}

					var $controls = $handle.find('.deskible-window-controls');

					if (opts.resizable) {
						$window.addClass('deskible-resizable');
						$controls.append($('<div/>', {
							'class': 'deskible-window-minimize ui button circular icon',
						}).append($('<i/>', {
							'class': 'icon minus'
						})));

						$controls.append($('<div/>', {
							'class': 'deskible-window-restore ui button circular icon',
						}).append($('<i/>', {
							'class': 'icon compress'
						})));

						$controls.append($('<div/>', {
							'class': 'deskible-window-maximize ui button circular icon',
						}).append($('<i/>', {
							'class': 'icon expand'
						})));

						resizable(wid, $window);
						$controls.find('.deskible-window-minimize').on('click', function(e) {
							e.preventDefault();
							e.stopPropagation();
							minWindow(id);
						});
						$controls.find('.deskible-window-restore').on('click', function(e) {
							e.preventDefault();
							e.stopPropagation();
							restoreWindow(id);
							reorderWindows(wid);
						}).hide();
						$controls.find('.deskible-window-maximize').on('click', function(e) {
							e.preventDefault();
							e.stopPropagation();
							maxWindow(id);
							reorderWindows(wid);
						});
					}

					if (opts.closable) {
						$window.addClass('deskible-closable');
						$controls.append($('<div/>', {
							'class': 'deskible-window-close ui button circular icon',
						}).append($('<i/>', {
							'class': 'icon remove'
						})));

						$controls.find('.deskible-window-close').on('click', function(e) {
							e.preventDefault();
							e.stopPropagation();
							di.closeWindow(wid, id);
							reorderWindows(wid);
						});
					}

					if (opts.dragable) {
						$window.addClass('deskible-dragable');
						dragable(wid, $window);
					}
				} else {
					$handle.remove();
				}

				$('.deskible-windows-desktop').append($window);
				if (opts.type != 'infopane') {
					$('.deskible-task').removeClass('active');
					$('.deskible-taskbar-dock-tasks-container').append($task);
				}

				if (typeof opts.content !== 'undefined') {
					if (opts.tabs) {
						for (var i = 0; i < opts.content.length; i++) {
							$.each(opts.content[i], function(tid, content) {
								di.buildContent(id, tid, content);
							});
						};

						$window.find('.deskible-window-tabs').on('click', 'li', function(e) {
							var $this = $(this);
							var $content = $this.closest('.deskible-window-pane').find('.deskible-window-content');
							var tid = $this.attr('data-tid');

							$this.closest('ul').find('li').removeClass('deskible-tab-active');
							$this.addClass('deskible-tab-active');
							$content.find('.deskible-tab-content').not('[data-tid=' + tid + ']').hide();
							$content.find('.deskible-tab-content[data-tid=' + tid + ']').show();
						});
					} else {
						di.buildContent(id, false, opts.content);
					}
				}

				setTimeout(function() {
					var tabsheight = 0;
					if (opts.tabs) {
						tabsheight = $window.find('.deskible-window-tabs').outerHeight(true);
					}

					var handleheight = 0;
					if ($window.find('.deskible-window-handle').length > 0) {
						handleheight = $handle.outerHeight(true);
					}

					$window.find('.deskible-window-pane').css('padding-top', handleheight + tabsheight);
					$window.find('.deskible-window-tabs').css('top', handleheight);
					var size = {
						'x': $window.outerWidth(true),
						'y': $window.outerHeight(true)
					}

					var ycenter = ($('.deskible-windows-desktop').height() - $('.deskible-taskbar').outerHeight(true) - size.y) / 2;
					var xcenter = ($('.deskible-windows-desktop').width() - size.x) / 2;
					if (opts.position == 'center') {
						$window.css({
							'top': ycenter,
							'left': xcenter
						});
					} else {
						if (opts.position.top == 'center' || opts.position.bottom == 'center') {
							opts.position.top = ycenter;
							delete opts.position.bottom;
						}

						if (opts.position.left == 'center' || opts.position.right == 'center') {
							opts.position.left = xcenter;
							delete opts.position.right;
						}
						$window.css(opts.position);
					}

					if (opts.type != 'infopane') {
						di.windows(wid, $window.offset(), 'position');
					}

					if (opts.maximized === true) {
						saveWindow(id);
						$window.addClass('deskible-window-maximized');
						$window.width('100%');
						$window.height('100%');
						$window.offset({top: 0, left: 0});
						$window.find('.deskible-window-maximize').hide();
						$window.find('.deskible-window-restore').show();
					}

					if (opts.minimized === true) {
						$window.addClass('deskible-window-minimized');
						$window.hide();
					}

					if (opts.type != 'infopane') {
						$window.addClass('animated ' + config.resAni);
					}

					$window.css('visibility', 'visible');
				}, 100);
			};

			di.closeWindow = function(wid, id) {
				$('#window-' + id).remove();

				if (wid >= 0) {
					windows[wid] = undefined;
					storage('windows', windows);
				
					$('#task-' + id).remove();
					setActiveTask();
				}

				if (id == 'sysdatetime') {
					clearInterval(di.clock);
				}
			};

			di.config = function(field, value) {
				if (typeof value === 'undefined') {
					value = config[field];

					return value;
				} else {
					config[field] = value;
					storage('config', config);

					return;
				}
			};

			di.windows = function(wid, value, field) {
				if (typeof value === 'undefined') {
					var w = storage('windows');

					if (typeof wid === 'undefined') {
						return w;
					} else {
						if (typeof w[wid] !== 'undefined') {
			 				return w[wid];
						}
					}
				} else {
					if (typeof wid === 'undefined') {
						return;
					}

					if (typeof field === 'undefined') {
						windows[wid] = value;
					} else {
						windows[wid][field] = value;
					}

					storage('windows', windows);
				}
			};
		}()
	});

	// make shortcut
	var di = $.deskible;

	return di;
}));
