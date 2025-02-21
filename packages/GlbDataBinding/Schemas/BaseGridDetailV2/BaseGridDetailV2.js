define("BaseGridDetailV2", ["GlbDataBindingMixin"], function() {
	return {
		mixins: {
			GlbDataBindingMixin: "Terrasoft.GlbDataBindingMixin"
		},
		methods: {
			getColumnsSetupButtonVisible: function() {
				return true;
			},
			addGridOperationsMenuItems: function(toolsButtonMenu) {
				this.callParent(arguments);
				if (this.getGridSettingsMenuItem()) {
					this.addBindProfileDataMenuItem(toolsButtonMenu);
				}
			},
			init: function() {
				this.callParent(arguments);
				this.mixins.GlbDataBindingMixin.init.call(this);
			}
		}
	};
});
