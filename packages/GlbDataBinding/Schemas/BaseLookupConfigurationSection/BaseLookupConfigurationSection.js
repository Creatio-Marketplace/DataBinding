define("BaseLookupConfigurationSection", [], function() {
	return {
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "BindDataButton",
				"parentName": "SeparateModeActionButtonsContainer",
				"propertyName": "items",
				"index": 2,
				"values": {
					"itemType": Terrasoft.ViewItemType.BUTTON,
					"style": Terrasoft.controls.ButtonEnums.style.BLUE,
					"caption": {"bindTo": "getBindDataButtonCaption"},
					"click": {"bindTo": "onBindLookupDataButtonClick"},
					"classes": {
						"textClass": ["actions-button-margin-right"],
						"wrapperClass": ["actions-button-margin-right"]
					},
					"menu": {
						"items": [{
							"caption": {"bindTo": "getBindAllDataButtonCaption"},
							"click": {"bindTo": "onBindAllLookupDataButtonClick"}
						}]
					},
					"visible": {"bindTo": "getBindDataButtonVisible"}
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
