define("GlbDataBindingMixin", ["GlbDataBindingMixinResources", "RightUtilities"],
	function(resources, RightUtilities) {

		Ext.define("Terrasoft.configuration.mixins.GlbDataBindingMixin", {
			alternateClassName: "Terrasoft.GlbDataBindingMixin",

			"IsBindDataEnabled": {
				dataValueType: Terrasoft.DataValueType.BOOLEAN,
				value: false
			},

			_bindSchemaName: null,

			_currentPackage: null,

			skippedColumns: ["CreatedBy", "ModifiedBy", "ProcessListeners"],

			init: function() {
				RightUtilities.checkCanExecuteOperation({ operation: "GlbCanCreateDataBinding" }, function(result) {
					this.set("IsBindDataEnabled", result);
				}, this);
			},

			calculateUId: function(str) {
				str = str || "";
				if (typeof(str) === "object") {
					str = JSON.stringify(str);
				}
				var hash = 0;
				for (var i = 0; i < str.length; i++) {
					hash = ~~(((hash << 5) - hash) + str.charCodeAt(i));
				}
				hash = hash >>> 0;
				return Terrasoft.GUID_EMPTY.replace(/[0]/g, function(c, p) {
					var value = ((p + 1) * hash).toString(16);
					return value[p % value.length];
				});
			},

			generateCodeForDataBinding: function(value, id) {
				value = value || "";
				var result = value
					.replace(new RegExp(/[-_]+/, "g"), " ")
					.replace(new RegExp(/[^\w\s]/, "g"), "")
					.replace(new RegExp(/\s+(.)(\w*)/, "g"), function($1, $2, $3) {
						return $2.toUpperCase() + $3.toLowerCase();
					})
					.replace(new RegExp(/\w/), function(s) {
						return s.toUpperCase();
					})
					.replace(new RegExp(/\s/, "g"), "");
				return result || (id && id.replace(new RegExp(/[^\w\d]/, "g"), ""));
			},

			getBindRecordInfo: function() {
				if (this.get("IsCardVisible")) {
					return this.sandbox.publish("GetPageRecordInfo", this, [this.getCardModuleSandboxId()]);
				} else {
					return {
						id: this.get("Id"),
						name: this.get("Name"),
						code: this.get("Code")
					};
				}
			},

			selectPackage: function(callback, scope) {
				this.showBodyMask({showHidden: true});
				this.callService({
					serviceName: "GlbDataBindingService",
					methodName: "GetBindDataPackages",
					data: {
						schemaName: this._bindSchemaName
					}
				}, function(response) {
					this.hideBodyMask();
					this.onLoadPackagesCollection(response, callback, scope);
				}, this);
			},

			onLoadPackagesCollection: function(responseObject, callback, scope) {
				var response = Ext.decode(responseObject, true) || {};
				var message;
				if (response.success) {
					if (response.rowsAffected === 1) {
						this._currentPackage = response.rows[0];
						callback.call(scope || this);
					} else if (response.rowsAffected > 1) {
						var esq = Ext.create("Terrasoft.EntitySchemaQuery", {
							rootSchema: "SysPackage"
						});
						esq.parseResponse(response, function(result) {
							this.set("PackagesCollection", result);
							this.openPackagePopup(callback, scope);
						}, this);
					} else {
						message = Ext.String.format(resources.localizableStrings.NoAvailablePackagesError, this._bindSchemaName);
						this.showInformationDialog(message);
					}
				} else {
					message = response.message || resources.localizableStrings.SendingRequestError;
					this.showInformationDialog(message);
				}
			},

			openPackagePopup: function(callback, scope) {
				this.set("PackagesList", new Terrasoft.Collection());
				var buttons = [
					Terrasoft.MessageBoxButtons.SAVE,
					Terrasoft.MessageBoxButtons.CANCEL
				];
				Terrasoft.utils.inputBox(resources.localizableStrings.SelectPackageMessage, function(result, arg) {
					var selectedPackage = arg.Package.value;
					if (result === Terrasoft.MessageBoxButtons.SAVE.returnCode && !Ext.isEmpty(selectedPackage)) {
						this._currentPackage = selectedPackage;
						callback.call(scope || this);
					}
				}, buttons, this, {
					Package: {
						"dataValueType": Terrasoft.DataValueType.ENUM,
						"value": { "bindTo": "Package" },
						"customConfig": {
							"list": { "bindTo": "PackagesList" },
							"prepareList": { "bindTo": "preparePackagesList" }
						}
					}
				});
				Terrasoft.each(Terrasoft.MessageBox.controlArray, function(item) {
					item.control.bind(this);
				}, this);
			},

			preparePackagesList: function(searchValue, list) {
				var packagesCollection = this.get("PackagesCollection");
				if (list && packagesCollection) {
					list.clear();
					var objects = {};
					packagesCollection.collection.each(function(item) {
						var key = item.get("value");
						objects[key] = item.model.attributes;
					}, this);
					list.loadAll(objects);
				}
			},

			getBindDataButtonVisible: function() {
				return this.get("IsBindDataEnabled") &&
					this.get("Operation") !== Terrasoft.ConfigurationEnums.CardOperation.ADD &&
					this.get("Operation") !== Terrasoft.ConfigurationEnums.CardOperation.COPY;
			},

			getProfileDataButtonVisible: function() {
				return this.get("IsBindDataEnabled") && this.getColumnsSetupButtonVisible();
			},

			addBindProfileDataMenuItem: function(menuItems) {
				menuItems.addItem(this.getButtonMenuItem({
					"Caption": resources.localizableStrings.BindProfileCaption,
					"Click": { "bindTo": "onBindProfileDataClick" },
					"Visible": { "bindTo": "getProfileDataButtonVisible" }
				}));
				menuItems.addItem(this.getButtonMenuItem({
					"Caption": resources.localizableStrings.ClearProfileCaption,
					"Click": { "bindTo": "onClearProfileDataClick" },
					"Visible": { "bindTo": "getProfileDataButtonVisible" }
				}));
			},

			getBindDataButtonCaption: function() {
				return resources.localizableStrings.BindDataButtonCaption;
			},

			getBindAllDataButtonCaption: function() {
				return resources.localizableStrings.BindAllDataButtonCaption;
			},

			getBindLookupButtonCaption: function() {
				return resources.localizableStrings.BindLookupButtonCaption;
			},

			getBindOperationButtonCaption: function() {
				return resources.localizableStrings.BindOperationButtonCaption;
			},

			getBindSettingButtonCaption: function() {
				return resources.localizableStrings.BindSettingButtonCaption;
			},

			getBindRoleButtonCaption: function() {
				return resources.localizableStrings.BindRoleButtonCaption;
			},

			getBindWorkplaceButtonCaption: function() {
				return resources.localizableStrings.BindWorkplaceButtonCaption;
			},

			onClearProfileDataClick: function() {
				var caption = this.get("Caption") || this.get("SeparateModeActionsButtonHeaderMenuItemCaption") || "";
				var objectType = this.get("Caption") ? resources.localizableStrings.DetailCaption :
					resources.localizableStrings.SectionCaption;
				var messageTemplate = resources.localizableStrings.ColumnsSetupRestoredConfirm;
				this.showConfirmationDialog(Ext.String.format(messageTemplate, objectType, caption), function(returnCode) {
					if (returnCode === Terrasoft.MessageBoxButtons.YES.returnCode) {
						this.clearProfileData();
					}
				}, [Terrasoft.MessageBoxButtons.YES, Terrasoft.MessageBoxButtons.NO]);
			},

			clearProfileData: function() {
				this.showBodyMask({showHidden: true});
				this.callService({
					serviceName: "GlbDataBindingService",
					methodName: "RestoreColumnSetup",
					data: {
						profileKey: this.getProfileKey()
					}
				}, function(response) {
					if (response && response.success) {
						if (response.rowsAffected) {
							this.applyDefaultColumnSetup();
							this.showInformationDialog(resources.localizableStrings.ColumnsSetupRestoredMessage, function() {
								this.reloadGridColumnsConfig(true);
							});
						} else {
							this.showInformationDialog(resources.localizableStrings.ColumnsSetupRestoredMessage);
						}
					} else {
						var message = response.message || resources.localizableStrings.SendingRequestError;
						this.showInformationDialog(message, Terrasoft.emptyFn, {
							style: Terrasoft.controls.MessageBoxEnums.Styles.RED
						});
					}
					this.hideBodyMask();
				}, this);
			},

			applyDefaultColumnSetup: function() {
				this.requireProfile(function(profile) {
					profile = Terrasoft.ColumnUtilities.updateProfileColumnCaptions({
						profile: profile,
						entityColumns: this.columns
					});
					this.set("Profile", profile);
					this.set("IsClearGridData", true);
					this.loadGridData();
				}, this);
			},

			onBindProfileDataClick: function() {
				this._bindSchemaName = "SysProfileData";
				var profileKey = this.getProfileKey();
				var records;
				var esq = Ext.create("Terrasoft.EntitySchemaQuery", {
					rootSchemaName: this._bindSchemaName
				});
				esq.addColumn("Id");
				esq.filters.addItem(esq.createColumnFilterWithParameter(
					Terrasoft.ComparisonType.EQUAL, "Key", profileKey));
				esq.filters.addItem(esq.createColumnIsNullFilter("Contact"));

				Terrasoft.chain(
					function(next) {
						esq.getEntityCollection(function(result) {
							if (result.success) {
								records = result.collection.getKeys();
								if (records.length) {
									next();
								} else {
									this.showInformationDialog(
										resources.localizableStrings.ColumnsSetupNotFoundMessage);
								}
							}
						}, this);
					},
					this.selectPackage,
					function() {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: records,
							name: this._bindSchemaName + "_" + profileKey,
							uId: this.calculateUId(profileKey)
						}, function(response, schema) {
							this.showDataBindingDetailsWindow(response, [schema && schema.uId]);
						}, this);
					},
					this);
			},

			onBindLookupButtonClick: function() {
				this._bindSchemaName = "Lookup";
				var code, uId, records;
				var lookupConfig = {
					entitySchemaName: this._bindSchemaName,
					columns: ["Id", "Name"],
					isQuickAdd: false,
					multiSelect: true
				};
				Terrasoft.chain(
					function(next) {
						if (this.get("IsCardVisible") || this.get("IsCardOpened")) {
							var recordInfo = this.getBindRecordInfo();
							records = [recordInfo.id];
							uId = recordInfo.id;
							code = this.generateCodeForDataBinding(recordInfo.name, recordInfo.id);
							next();
						} else {
							this.openLookup(lookupConfig, function(result) {
								records = result.selectedRows.getKeys();
								if (records.length) {
									if (records.length === 1) {
										var selectedRow = result.selectedRows.first();
										uId = selectedRow.Id;
										code = this.generateCodeForDataBinding(selectedRow.Name, selectedRow.Id);
									} else {
										uId = this.calculateUId(records.sort());
										code = uId.replaceAll("-", "");
									}
									next();
								}
							}, this);
						}
					},
					this.selectPackage,
					function() {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: records,
							name: this._bindSchemaName + "_" + code,
							uId: uId
						}, function(response, schema) {
							this.showDataBindingDetailsWindow(response, [schema && schema.uId]);
						}, this);
					},
					this);
			},

			onBindLookupDataButtonClick: function() {
				this._bindSchemaName = this.entitySchemaName;
				var code, uId, records;
				var lookupConfig = {
					entitySchemaName: this._bindSchemaName,
					isQuickAdd: false,
					multiSelect: true
				};
				Terrasoft.chain(
					function(next) {
						this.openLookup(lookupConfig, function(result) {
							records = result.selectedRows.getKeys();
							if (records.length) {
								if (records.length === 1) {
									var selectedRow = result.selectedRows.first();
									uId = selectedRow.Id;
									code = this.generateCodeForDataBinding(selectedRow.Name, selectedRow.Id);
								} else {
									uId = this.calculateUId(records.sort());
									code = uId.replaceAll("-", "");
								}
								next();
							}
						}, this);
					},
					this.selectPackage,
					function() {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: records,
							name: this._bindSchemaName + "_" + code,
							uId: uId
						}, function(response, schema) {
							this.showDataBindingDetailsWindow(response, [schema && schema.uId]);
						}, this);
					},
					this);
			},

			onBindAllLookupDataButtonClick: function() {
				this._bindSchemaName = this.entitySchemaName;
				var code, uId, records;
				var esq = Ext.create("Terrasoft.EntitySchemaQuery", {
					rootSchemaName: this._bindSchemaName
				});
				esq.addColumn("Id");
				Terrasoft.chain(
					function(next) {
						esq.getEntityCollection(function(result) {
							if (result.success) {
								records = result.collection.getKeys();
								if (records.length) {
									next();
								} else {
									var message = resources.localizableStrings.NoDataFound;
									this.showInformationDialog(message);
								}
							}
						}, this);
					},
					this.selectPackage,
					function() {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: records,
							name: this._bindSchemaName + "_Values"
						}, function(response, schema) {
							this.showDataBindingDetailsWindow(response, [schema && schema.uId]);
						}, this);
					},
					this);
			},

			onBindOperationButtonClick: function() {
				this._bindSchemaName = "SysAdminOperation";
				var recordInfo = this.getBindRecordInfo();
				recordInfo.code = this.generateCodeForDataBinding(recordInfo.code);
				var uIds = [];
				Terrasoft.chain(
					this.selectPackage,
					function(next) {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: [recordInfo.id],
							name: this._bindSchemaName + "_" + recordInfo.code,
							uId: recordInfo.id
						}, function(response, schema) {
							if (response.success) {
								uIds.push(schema && schema.uId);
								next();
							} else {
								this.showDataBindingDetailsWindow(response);
							}
						}, this);
					},
					function() {
						this.bindAdditionalData({
							schemaName: "SysAdminOperationGrantee",
							filterColumn: this._bindSchemaName,
							recordId: recordInfo.id,
							name: "SysAdminOperationGrantee_" + recordInfo.code,
							uId: this.calculateUId("SysAdminOperationGrantee" + recordInfo.id)
						}, function(response, schema) {
							uIds.push(schema && schema.uId);
							this.showDataBindingDetailsWindow(response, uIds);
						}, this);
					},
					this);
			},

			onBindSettingButtonClick: function() {
				this._bindSchemaName = "SysSettings";
				var recordInfo = this.getBindRecordInfo();
				recordInfo.code = this.generateCodeForDataBinding(recordInfo.code);
				var uIds = [];
				Terrasoft.chain(
					this.selectPackage,
					function(next) {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: [recordInfo.id],
							name: this._bindSchemaName + "_" + recordInfo.code,
							uId: recordInfo.id
						}, function(response, schema) {
							if (response.success) {
								uIds.push(schema && schema.uId);
								next();
							} else {
								this.showDataBindingDetailsWindow(response);
							}
						}, this);
					},
					function() {
						this.bindAdditionalData({
							schemaName: "SysSettingsValue",
							filterColumn: this._bindSchemaName,
							recordId: recordInfo.id,
							name: "SysSettingsValue_" + recordInfo.code,
							uId: this.calculateUId("SysSettingsValue" + recordInfo.id)
						}, function(response, schema) {
							uIds.push(schema && schema.uId);
							this.showDataBindingDetailsWindow(response, uIds);
						}, this);
					},
					this);
			},

			onBindRoleButtonClick: function() {
				this._bindSchemaName = "SysAdminUnit";
				var recordInfo = this.getBindRecordInfo();
				recordInfo.code = this.generateCodeForDataBinding(recordInfo.name, recordInfo.id);
				Terrasoft.chain(
					this.selectPackage,
					function(next) {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: [recordInfo.id],
							name: this._bindSchemaName + "_" + recordInfo.code,
							uId: recordInfo.id
						}, function(response, schema) {
							this.showDataBindingDetailsWindow(response, [schema && schema.uId]);
						}, this);
					},
					this);
			},

			onBindWorkplaceButtonClick: function() {
				this._bindSchemaName = "SysWorkplace";
				var recordInfo = this.getBindRecordInfo();
				recordInfo.code = this.generateCodeForDataBinding(recordInfo.name, recordInfo.id);
				var uIds = [];
				Terrasoft.chain(
					this.selectPackage,
					function(next) {
						this.runBindService({
							schemaName: this._bindSchemaName,
							records: [recordInfo.id],
							name: this._bindSchemaName + "_" + recordInfo.code,
							uId: recordInfo.id
						}, function(response, schema) {
							if (response.success) {
								uIds.push(schema && schema.uId);
								next();
							} else {
								this.showDataBindingDetailsWindow(response);
							}
						}, this);
					},
					function(next) {
						this.bindAdditionalData({
							schemaName: "SysModuleInWorkplace",
							filterColumn: this._bindSchemaName,
							recordId: recordInfo.id,
							name: "SysModuleInWorkplace_" + recordInfo.code,
							uId: this.calculateUId("SysModuleInWorkplace" + recordInfo.id)
						}, function(response, schema) {
							if (response.success) {
								uIds.push(schema && schema.uId);
								next();
							} else {
								this.showDataBindingDetailsWindow(response);
							}
						}, this);
					},
					function() {
						this.bindAdditionalData({
							schemaName: "SysAdminUnitInWorkplace",
							filterColumn: this._bindSchemaName,
							recordId: recordInfo.id,
							name: "SysAdminUnitInWorkplace_" + recordInfo.code,
							uId: this.calculateUId("SysAdminUnitInWorkplace" + recordInfo.id)
						}, function(response, schema) {
							uIds.push(schema && schema.uId);
							this.showDataBindingDetailsWindow(response, uIds);
						}, this);
					},
					this);
			},


			bindAdditionalData: function(config, callback, scope) {
				var records;
				var esq = Ext.create("Terrasoft.EntitySchemaQuery", {
					rootSchemaName: config.schemaName
				});
				esq.addColumn("Id");
				esq.filters.addItem(esq.createColumnFilterWithParameter(
					Terrasoft.ComparisonType.EQUAL, config.filterColumn, config.recordId));

				Terrasoft.chain(
					function(next) {
						esq.getEntityCollection(function(result) {
							if (result.success) {
								records = result.collection.getKeys();
								if (records.length) {
									next();
								} else {
									callback.call(scope || this, {success: true});
								}
							}
						}, this);
					},
					function() {
						config.records = records;
						this.runBindService(config, function(response, schema) {
							callback.call(scope || this, response, schema);
						}, this);
					},
					this);
			},

			runBindService: function(config, callback, scope) {
				this.showBodyMask({showHidden: true});
				Terrasoft.require([config.schemaName], function(schema) {
					config.schemaUId = schema.uId;
					config.name = config.name.replaceAll("-", "");
					config.columns  = this.generateDataBindingColumns(config.schemaName, schema.columns);
					var saveSchema = this.generateDataBindingSchema(config);
					this.saveDataBindingSchema(saveSchema, callback, scope);
				}, this);
			},

			generateDataBindingColumns: function(schemaName, columnsObj) {
				var columns = [];
				var config = this.getDataBindingColumnsConfig(schemaName);
				Terrasoft.each(columnsObj, function(value) {
					if (Terrasoft.contains(this.skippedColumns, value.name)) {
						return true;
					}
					columns.push({
						"uId": value.uId,
						"name": value.name,
						"caption": value.caption,
						"isForceUpdate": Terrasoft.contains(config.forceColumns, value.name),
						"isKey": Terrasoft.contains(config.keysColumns, value.name)
					});
				}, this);
				return columns;
			},

			getDataBindingColumnsConfig: function(schemaName) {
				var keysColumns = ["Id"];
				var forceColumns = [];
				switch (schemaName) {
					case "Lookup":
						forceColumns = ["Name", "Description", "SysEntitySchemaUId", "SysPageSchemaUId"];
						break;
					case "SysProfileData":
						keysColumns = ["Key", "Contact", "SysCulture"];
						forceColumns = ["ObjectData"];
						break;
					case "SysAdminUnit":
						break;
					case "SysSettings":
						forceColumns = ["Name", "Position", "IsPersonal", "IsCacheable", "ReferenceSchemaUId", "IsSSPAvailable", "ValueTypeName"];
						break;
					case "SysSettingsValue":
						keysColumns = ["SysSettings", "SysAdminUnit"];
						forceColumns = ["IsDef", "Position", "TextValue", "IntegerValue", "FloatValue", "BooleanValue", "DateTimeValue", "GuidValue", "BinaryValue"];
						break;
					case "SysAdminOperation":
						forceColumns = ["Name", "Description"];
						break;
					case "SysAdminOperationGrantee":
						keysColumns = ["SysAdminOperation", "SysAdminUnit"];
						forceColumns = ["CanExecute", "Position"];
						break;
					case "SysWorkplace":
						forceColumns = ["Name", "Position", "HomePageUId"];
						break;
					case "SysModuleInWorkplace":
						keysColumns = ["SysWorkplace", "SysModule"];
						forceColumns = ["Position"];
						break;
					case "SysAdminUnitInWorkplace":
						keysColumns = ["SysWorkplace", "SysAdminUnit"];
						break;
				}
				return {
					keysColumns: keysColumns,
					forceColumns: forceColumns
				};
			},

			generateDataBindingSchema: function(config) {
				return {
					"uId": config.uId || config.schemaUId,
					"name": config.name,
					"isReadOnly": false,
					"entitySchemaName": config.schemaName,
					"entitySchemaUId": config.schemaUId,
					"installType": 0,
					"body": null,
					"package": this._currentPackage,
					"columns": config.columns,
					"boundRecordIds": config.records
				};
			},

			saveDataBindingSchema: function(schema, callback, scope) {
				this.callService({
					serviceName: "../ServiceModel/SchemaDataDesignerService.svc",
					methodName: "SaveSchema",
					data: schema
				}, function(response) {
					callback.call(scope || this, response, schema);
					this.hideBodyMask();
				}, this);
			},

			showDataBindingDetailsWindow: function(response, uIds) {
				var msgStyle = Terrasoft.controls.MessageBoxEnums.Styles.RED;
				var buttons = [Terrasoft.MessageBoxButtons.CLOSE];
				var message = response.errorInfo && response.errorInfo.message;

				if (response.success) {
					if (message) {
						this.log(message, Terrasoft.LogMessageType.WARNING);
					}
					buttons.push({
						className: "Terrasoft.Button",
						returnCode: "ViewDetails",
						style: Terrasoft.controls.ButtonEnums.style.DEFAULT,
						caption: resources.localizableStrings.ViewDetailsCaption
					});
					message = resources.localizableStrings.DataBoundMessage;
					msgStyle = Terrasoft.controls.MessageBoxEnums.Styles.BLUE;
				}
				message = message || resources.localizableStrings.SendingRequestError;
				this.showInformationDialog(message, function(returnCode) {
					if (returnCode === "ViewDetails") {
						this.openDataBinding(uIds);
					}
				}, {
					style: msgStyle,
					buttons: buttons
				});
			},

			openDataBinding: function(uIds) {
				Terrasoft.each(uIds, function(uId) {
					if (uId) {
						var url = Terrasoft.workspaceBaseUrl + "/ClientApp/#/SchemaDataDesigner/" + uId;
						window.open(url, "_blank");
					}
				}, this);
			}
		});

		return Terrasoft.GlbDataBindingMixin;
	});
