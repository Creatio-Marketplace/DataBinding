namespace Terrasoft.Configuration.GlbDataBindingService
{
	using System;
	using System.ServiceModel;
	using System.ServiceModel.Activation;
	using System.ServiceModel.Web;
	using System.Runtime.Serialization;
	using Terrasoft.Common;
	using Terrasoft.Core.Factories;
	using Terrasoft.Nui.ServiceModel.DataContract;
	using Terrasoft.Web.Common;

	#region Class: GlbDataBindingService

	[ServiceContract]
	[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
	class GlbDataBindingService : BaseService
	{

		#region Methods: Public

		[OperationContract]
		[WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
		public string GetBindDataPackages(Request request) {
			var helper = ClassFactory.Get<GlbDataBindingHelper>(
				new ConstructorArgument("userConnection", UserConnection)
			);
			var result = helper.GetPackages(request.SchemaName);
			return ServiceStack.Text.JsonSerializer.SerializeToString(result);
		}

		[OperationContract]
		[WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
		public Response RestoreColumnSetup(Request request) {
			var helper = ClassFactory.Get<GlbDataBindingHelper>(
				new ConstructorArgument("userConnection", UserConnection)
			);
			var result = helper.ClearColumnsSetup(request.ProfileKey);
			return result;
		}

		#endregion
	}

	#endregion

	#region Class: Response

	[DataContract]
	public class Response: SelectQueryResponse
	{		
		[DataMember(Name = "message")]
		public string Message {get; set;}
	}

	#endregion

	#region Class: Request

	[DataContract]
	public class Request
	{
		[DataMember(Name = "schemaName")]
		public string SchemaName {get; set;}

		[DataMember(Name = "profileKey")]
		public string ProfileKey {get; set;}
	}

	#endregion
}