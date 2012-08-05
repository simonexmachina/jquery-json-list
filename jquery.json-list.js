(function($) {
	$.fn.jsonList = function( options ) {
		return this.each(function() {
			new JSONList(this, options);
		});
	};
	var JSONList = function( el, options ) {
		this.el = $(el);
		// fill options with default values
		this.options = options = $.extend({
			type: 'groupedItems',
			url: null,
			data: null,
			groupLabel: 'name',
			itemLabel: 'name',
			success: function( jsonList ) {},
			onListItem: function( listItem, data, isGroup ) {},
		}, options);
		var self = this;
		$.getJSON(options.url, options.data, function(data, textStatus) {
			self.handleResponse(data, textStatus);
		});
	};
	JSONList.prototype = {
		handleResponse: function( data, textStatus ) {
			if( this.options.type == 'groupedItems' ) {
				this.groupedItems(data, textStatus);
			}
			if( this.options.success ) {
				this.options.success.call(this.el, this);
			}
		},
		groupedItems: function( data, textStatus ) {
			var opts = $.extend({
					groups: 'groups',
					items: 'items',
				}, this.options),
				groups = {},
				items = {};
			this.groups = groups;
			this.items = items;
			$.each(data[opts.items], function(i, item) {
				items[item.id] = item;
			});
			$.each(data[opts.groups], function(i, group) {
				var children = [];
				if( group.children ) {
					$.each(group.children, function(i, childId) {
						children.push(items[childId]);
					});
				}
				group.children = children;
				groups[group.id] = group;
			});
			$.each(groups, function(id, group) {
				var subGroups = [];
				if( group.subGroups ) {
					$.each(group.subGroups, function(i, childId) {
						subGroups.push(groups[childId]);
						delete groups[childId];
					});
				}
				group.subGroups = subGroups;
			});
			this.el.append(this.createList(groups));
		},
		createList: function( groups ) {
			var list = $('<ol>');
			return this.appendGroupItems(groups, list);
		},
		appendGroupItems: function( groups, list ) {
			var self = this;
			$.each(groups, function(id, group) {
				var listItem = $('<li>' + self.getGroupLabel(group) + '</li>');
				self.options.onListItem.call(this, listItem, group, true);
				if( group.subGroups || group.children ) {
					var subList = $('<ol>');
					if( group.subGroups ) {
						self.appendGroupItems(group.subGroups, subList);
					}
					if( group.children ) {
						self.appendItems(group.children, subList);
					}
					listItem.append(subList);
				}
				list.append(listItem);
			});
			return list;
		},
		appendItems: function( items, list ) {
			var self = this;
			$.each(items, function(id, item) {
				var listItem = $('<li>' + self.getItemLabel(item) + '</li>');
				self.options.onListItem.call(this, listItem, item, false);
				list.append(listItem);
			});
		},
		getGroupLabel: function( group ) {
			return group[this.options.groupLabel];
		},
		getItemLabel: function( item ) {
			return item[this.options.itemLabel];
		}
	};
}(jQuery));