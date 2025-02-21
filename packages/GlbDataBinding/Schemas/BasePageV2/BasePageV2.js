define("BasePageV2", ["GlbDataBindingMixin"], function() {
	return {
		mixins: {
			GlbDataBindingMixin: "Terrasoft.GlbDataBindingMixin"
		},
		messages: {
			"GetPageRecordInfo": {
				mode: this.Terrasoft.MessageMode.PTP,
				direction: this.Terrasoft.MessageDirectionType.SUBSCRIBE
			}
		},
		methods: {
			getColumnsSetupButtonVisible: function() {
				return this.get("IsGridSettingsMenuVisible");
			},
			getViewOptions: function() {
				var viewOptions = this.callParent(arguments);
				viewOptions.addItem(this.getButtonMenuSeparator());
				this.addBindProfileDataMenuItem(viewOptions);
				return viewOptions;
			},
			subscribeSandboxEvents: function() {
				this.callParent(arguments);
				this.sandbox.subscribe("GetPageRecordInfo", function() {
					return {
						id: this.get("Id"),
						name: this.get("Name"),
						code: this.get("Code")
					};
				}, this, [this.sandbox.id]);
			},
			init: function() {
				this.callParent(arguments);
				this.mixins.GlbDataBindingMixin.init.call(this);
			}
		}
	};
});