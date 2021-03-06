/*!
 * jquery dropdown 1.0
 * Copyright 2011, Stefan Benicke (opusonline.at)
 * Dual licensed under the MIT or GPL Version 3 licenses. (LICENSES.txt)
 */
(function($){
	
	var defaults = {
		speed: 250,
		maxElements: 10,
		searchField: 'auto',
		activeText: '<span class="dropdown_arrow"/>',
		namespace: '.dropdown',
		highlight: function(value, term) {
			return value.replace(new RegExp('(?![^&;]+;)(?!<[^<>]*)(' + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, '\\$1') + ')(?![^<>]*>)(?![^&;]+;)', 'gi'), '<b>$1</b>');
		}
	},
	key_esc = 27,
	key_enter = 13,
	key_up = 38,
	key_down = 40;
	
	$.fn.dropdown = function(options) {
		
		var options = $.extend({}, defaults, options);
		
		return this.each(function() {
			
			var $select = $(this),
			list = [],
			result = [],
			$dropdown,
			$dropdown_active,
			$dropdown_list,
			$dropdown_search,
			$dropdown_list_active,
			$dropdown_list_hover,
			option_height,
			is_open,
			search_hidden,
			trigger_change = true,
			timer,
			
			_init = function() {
				
				$('<span class="dropdown_wrap"/>').insertAfter($select).append(
					$dropdown_active = $('<span class="dropdown_active"/>').bind('click' + options.namespace, _showList),
					$dropdown = $('<div class="dropdown" style="position:absolute;left:-9999px"/>').bind('mouseleave' + options.namespace, _removeHover).append(
						$dropdown_search = $('<input type="text" class="dropdown_search"/>').bind('keydown' + options.namespace, _keyAction).bind('keyup' + options.namespace, _search).bind('blur' + options.namespace, _hideList).bind('focus' + options.namespace, _showList),
						$dropdown_list = $('<div class="dropdown_list"/>')
					)
				);
				
				var index = 0,
				select = 0;
				$select.hide().bind('valchange' + options.namespace, _valChange).find('option').each(function() {
					var $option = $(this),
					name = $option.html(),
					value = $option.val(),
					selected = $option.attr('selected');
					list[index] = {name: name, value: value};
					list[index].element = $('<div class="dropdown_option">' + name + '</div>').data({index: index, entry: index}).bind('click' + options.namespace, _setActive).bind('mouseenter' + options.namespace, _addHover).appendTo($dropdown_list);
					result.push(list[index].element);
					if (selected) select = index;
					index++;
				});
				_setIndexActive(select);
				if ( ! options.searchField || (options.maxElements != 'all' && options.searchField == 'auto' && list.length < options.maxElements)) {
					_hideSearch();
				}
				option_height = list[0].element.outerHeight();
				if (options.maxElements != 'all') {
					var max_height = option_height * options.maxElements;
					$dropdown_list.css('max-height', max_height);
				}
			},
			_setIndexActive = function(index) {
				var name = list[index].name + options.activeText;
				var $last_active;
				$dropdown_active.html(name);
				if ($dropdown_list_active) {
					$last_active = $dropdown_list_active.removeClass('active');
				}
				$dropdown_list_active = list[index].element.addClass('active');
				if ($last_active && $dropdown_list_active != $last_active) {
					$select.val(list[index].value);
					if (trigger_change) {
						$select.change();
					}
					trigger_change = true;
				}
				_hideList();
			},
			_setActive = function() {
				var index = $(this).data('entry');
				_setIndexActive(index);
			},
			_hideSearch = function() {
				$dropdown_search.css({position: 'absolute', left: -9999});
				search_hidden = true;
			},
			_showList = function() {
				if (is_open) return;
				is_open = true;
				$dropdown.hide().css({left:0}).fadeIn(options.speed);
				_addHover.call($dropdown_list_active);
				$dropdown_search.focus();
			},
			_hideList = function() {
				if ( ! is_open) return;
				is_open = false;
				timer = setTimeout(function() {
					$dropdown.css({left:-9999}).show();
				}, 100);
			},
			_addHover = function() {
				if ($dropdown_list_hover) {
					_removeHover();
				}
				$dropdown_list_hover = $(this).addClass('hover');
			},
			_removeHover = function() {
				$dropdown_list_hover.removeClass('hover');
				$dropdown_list_hover = null;
			},
			_hoverNext = function() {
				if ($dropdown_list_hover) {
					var index = $dropdown_list_hover.data('index'),
					next_index = index + 1;
					if (next_index == result.length) return;
					var next = result[next_index];
					_addHover.call(next);
					_scrollIt(next_index);
				} else {
					_addHover.call(result[0]);
					_scrollIt(0);
				}
			},
			_hoverPrev = function() {
				if ($dropdown_list_hover) {
					var index = $dropdown_list_hover.data('index');
					if ( ! index) return;
					var next_index = index - 1,
					next = result[next_index];
					_addHover.call(next);
					_scrollIt(next_index);
				} else {
					var last = result.length - 1;
					_addHover.call(result[last]);
					_scrollIt(last);
				}
			},
			_scrollIt = function(index) {
				if (options.maxElements == 'all' || (options.maxElements != 'all' && result.length < options.maxElements)) return;
				var scroll_top = $dropdown_list.scrollTop(),
				scroll_height = option_height * options.maxElements,
				scroll_end = scroll_height + scroll_top - option_height,
				scroll_index = index * option_height;
				if (scroll_index < scroll_top) {
					$dropdown_list.scrollTop(scroll_index);
				}
				if (scroll_index > scroll_end) {
					$dropdown_list.scrollTop(scroll_index - scroll_height + option_height);
				}
			},
			_keyAction = function(event) {
				if ( ! is_open) return;
				var code = event.keyCode;
				if (code == key_esc || code == key_enter || code == key_up || code == key_down) {
					event.preventDefault();
				}
				if (code == key_esc) {
					_hideList();
					return false;
				} else if (code == key_enter) {
					_setActive.call($dropdown_list_hover);
					_hideList();
					return false;
				} else if (code == key_up) {
					_hoverPrev();
				} else if (code == key_down) {
					_hoverNext();
				}
			},
			_valChange = function() {
				var new_value = $select.val();
				$.each(list, function(key, entry) {
					if (entry.value == new_value) {
						trigger_change = false;
						_setActive.call(entry.element);
						return;
					}
				});
			},
			_search = function(event) {
				var code = event.keyCode;
				if (search_hidden || code == key_esc || code == key_enter || code == key_up || code == key_down) {
					return;
				}
				var query = $dropdown_search.val().toLowerCase(),
				index = 0;
				result = [];
				$.each(list, function(key, entry) {
					if (entry.name.toLowerCase().indexOf(query) > -1) {
						var name = options.highlight(entry.name, query);
						result.push(entry.element.html(name).show().data('index', index++));
					} else {
						entry.element.hide();
					}
				});
				if (result.length) {
					_addHover.call(result[0]);
				}
			};
			
			_init();
		});
		
	};
	
})(jQuery);
