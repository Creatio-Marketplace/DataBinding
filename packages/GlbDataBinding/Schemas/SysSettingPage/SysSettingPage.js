define("SysSettingPage", [], function() {
	return {
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "BindSettingButton",
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"index": 5,
				"values": {
					"itemType": Terrasoft.ViewItemType.BUTTON,
					"style": Terrasoft.controls.ButtonEnums.style.BLUE,
					"caption": {"bindTo": "getBindSettingButtonCaption"},
					"click": {"bindTo": "onBindSettingButtonClick"},
					"classes": {
						"textClass": ["actions-button-margin-right"],
						"wrapperClass": ["actions-button-margin-right"]
					},
					"visible": {"bindTo": "getBindDataButtonVisible"}
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
