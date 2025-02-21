define("SysWorkplaceSectionV2", [], function() {
	return {
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "BindWorkplaceButton",
				"parentName": "CombinedModeActionButtonsCardLeftContainer",
				"propertyName": "items",
				"index": 5,
				"values": {
					"itemType": Terrasoft.ViewItemType.BUTTON,
					"style": Terrasoft.controls.ButtonEnums.style.BLUE,
					"caption": {"bindTo": "getBindWorkplaceButtonCaption"},
					"click": {"bindTo": "onBindWorkplaceButtonClick"},
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
