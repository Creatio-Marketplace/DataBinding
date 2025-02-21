namespace Terrasoft.Configuration.GlbDataBindingService
{
	using System;
	using System.Collections.Generic;
	using System.Linq;
	using Terrasoft.Common;
	using Terrasoft.Core;
	using Terrasoft.Core.Configuration;
	using Terrasoft.Core.DB;
	using Terrasoft.Core.Entities;
	using Terrasoft.Core.Packages;
	using DataValueType = Terrasoft.Nui.ServiceModel.DataContract.DataValueType;
	using EntityCollection = Terrasoft.Nui.ServiceModel.DataContract.EntityCollection;

	#region Class: GlbDataBindingHelper

	public class GlbDataBindingHelper
	{

		#region Fields: Private

		private UserConnection UserConnection;

		#endregion

		#region Constructors: Public

		public GlbDataBindingHelper(UserConnection userConnection) {
			UserConnection = userConnection;
		}

		#endregion

		#region Methods: Private

		private Guid GetSchemaRootPackageId(string schemaName) {
			var schema = UserConnection.EntitySchemaManager.GetInstanceByName(schemaName);
			var select = new Select(UserConnection)
					.Column("SysPackageId")
				.From("SysSchema")
				.Where("UId").IsEqual(Column.Parameter(schema.UId)) as Select;
			return select.ExecuteScalar<Guid>();
		}

		private EntityCollection GetAvailablePackages(Guid packageId) {
			var maintainer = SysSettings.GetValue<string>(UserConnection, "Maintainer", "");
			var result = new EntityCollection();
			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "SysPackage");
			esq.PrimaryQueryColumn.IsAlwaysSelect = true;
			var nameColumn = esq.AddColumn("Name").Name;
			var uidColumn = esq.AddColumn("UId").Name;
			esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "Maintainer", maintainer));
			esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "InstallType", 0));
			var packages = esq.GetEntityCollection(UserConnection);
			if (!packages.Any()) {
				throw new Exception(new LocalizableString(UserConnection.Workspace.ResourceStorage,
					"GlbDataBindingHelper",
					"LocalizableStrings.NoAvailablePackagesFound.Value"));
			}
			foreach (var package in packages) {
				IEnumerable<Guid> packageIds = WorkspaceUtilities.GetPackageHierarchyIdsById(UserConnection,
					package.PrimaryColumnValue, UserConnection.Workspace.Id);
				if (packageIds.Contains(packageId)) {
					result.Add(new Dictionary<string, object> {
						{ "displayValue", package.GetTypedColumnValue<string>(nameColumn) },
						{ "uId", package.GetTypedColumnValue<Guid>(uidColumn) },
						{ "value", package.PrimaryColumnValue }
					});
				}
			}
			return result;
		}

		#endregion

		#region Methods: Public

		public Response GetPackages(string schemaName) {
			var result = new Response {
				Success = false
			};
			try {
				schemaName.CheckArgumentNullOrEmpty("schemaName");
				Guid packageId = GetSchemaRootPackageId(schemaName);
				if (packageId != Guid.Empty) {
					var rows = GetAvailablePackages(packageId);
					result = new Response {
						Success = true,
						Rows = rows,
						RowsAffected = rows.Count,
						RowConfig = new Dictionary<string, object> {
							{ "displayValue", new { dataValueType = DataValueType.Text } },
							{ "uId", new { dataValueType = DataValueType.Guid } },
							{ "value", new { dataValueType = DataValueType.Guid } }
						}
					};
				}
			} catch (Exception ex) {				
				result.Message = ex.Message;
			}
			return result;			
		}

		public Response ClearColumnsSetup(string profileKey) {
			var result = new Response {
				Success = true
			};
			try {
				profileKey.CheckArgumentNullOrEmpty("profileKey");
				var delete = new Delete(UserConnection)
					.From("SysProfileData")
					.Where("ContactId").IsEqual(Column.Parameter(UserConnection.CurrentUser.ContactId))
					.And("Key").IsEqual(Column.Parameter(profileKey)) as Delete;
				result.RowsAffected = delete.Execute();
			} catch (Exception ex) {
				result.Success = false;
				result.Message = ex.Message;
			}
			return result;
		}

		#endregion

	}

	#endregion
}