'use strict';

var

	fs              =require('fs'),
	path            =require('path'),

	defaultData     ={
		"root":{
			"clusters":[],
			"schema":{
				"version":2,
				"classes":[]
			},
			"records":[],
			"indexes":[],
			"manualIndexes":[]
		},
		"cluster":{
			"id":null,
			"name":null
		},
		"schemaClass":{
			"name":null,
			"defaultClusterId":null,
			"clusterIds":[],
			"superClass":null,
			"clusterSelection":"round-robin",
			"properties":[]
		},
		"classProperty":{
			"name":null,
			"type":"STRING",
			"mandatory":true,
			"notNull":true,
			"collate":"default",
			"linkedClass":"Basic"
		},
		"record":{
			"@type":"d",
			"version":0,
			"name":null,
			"shortName":null,
			"defaultClusterId":null,
			"clusterIds":[],
			"clusterSelection":"round-robin",
			"overSize":0.0,
			"strictMode":false,
			"abstract":false,
			"properties":[],
			"superClass":null,
			"customFields":null,
			"fieldTypes":"overSize=f,properties=e"
		},
		"recordProperty":{
			"@type":"d",
			"version":0,
			"name":null,
			"type":null,
			"globalId":null,
			"mandatory":false,
			"readonly":false,
			"notNull":false,
			"min":null,
			"max":null,
			"regexp":null,
			"linkedClass":null,
			"customFields":null,
			"collate":"default"
		}
	},

	rules         ={

		"meta":{
			"clusterStartId":10//,
			//"schemaStartVersion":1
		},

		"templates":{
			"root":{
				"info":function(d){
					return {
						"name":d.info.name,
						"schema-version":d.schema.version,
						"default-cluster-id":3,
						"exporter-version":11,
						"engine-version":"2.0.8",
						"engine-build":"UNKNOWN@r$buildNumber; 2015-04-22 20:47:49+0000",
						"storage-config-version":14,
						"mvrbtree-version":3,
						"schemaRecordId":"#0:1",
						"indexMgrRecordId":"#0:2"
					};
				},
				"clusters":function(d){
					return d.clusters;
				},
				"schema":{
					"version":function(d){
						return d.schema.version
					},
					"classes":function(d){
						return d.classes;
					}
				},
				"records":function(d){
					return d.records;
				},
				"indexes":function(d){
					return d.indexes;
				},
				"manualIndexes":function(d){
					return d.manualIndexes;
				}
			},
			"cluster":function(d){
				return {
					"name":d.name,
					"id":d.id
				};
			},
			"schemaClass":function(d){
				return {
					"name":d.name,
					"default-cluster-id":d.defaultClusterId,
					"cluster-ids":d.clusterIds,
					"super-class":d.superClass,
					"cluster-selection":d.clusterSelection,
					"properties":d.properties
				};
			},
			"classProperty":function(d){
				var r={
					"name":d.name,
					"type":d.type,
					"mandatory":d.mandatory,
					"not-null":d.notNull,
					"collate":d.collate
				};
				if(
					[
						'EMBEDDEDLIST',
						'EMBEDDEDSET',
						'EMBEDDEDMAP',
						'LINKLIST',
						'LINKSET',
						'LINKMAP',
						'LINKBAG'
					].indexOf(d.type)!== -1
				){
					r['linked-class']='Basic';
				}
				return r;
			},
			"record":function(d){
				return {
					"@type":"d",
					"@version":d.version,
					"name":d.name,
					"shortName":d.shortName,
					"defaultClusterId":d.defaultClusterId,
					"clusterIds":d.clusterIds,
					"clusterSelection":d.clusterSelection,
					"overSize":d.overSize,
					"strictMode":d.strictMode,
					"abstract":d.abstract,
					"properties":d.properties,
					"superClass":d.superClass,
					"customFields":d.customFields,
					"@fieldTypes":d.fieldTypes
				};
			},
			"recordProperty":function(d){
				return {
					"@type":"d",
					"@version":d.version,
					"name":d.name,
					"type":d.type,
					"globalId":d.globalId,
					"mandatory":d.mandatory,
					"readonly":d.readonly,
					"notNull":d.notNull,
					"min":d.min,
					"max":d.max,
					"regexp":d.regexp,
					"linkedClass":d.linkedClass,
					"customFields":d.customFields,
					"collate":d.collate
				};
			}
		}
	},

	compileTpl=function(tplId,data){

		var
			tpl    =rules.templates[tplId],
			tmpData=JSON.parse(JSON.stringify(defaultData[tplId]));

		for(var p in data){
			if(tmpData.hasOwnProperty(p)){
				tmpData[p]=data[p];
			}else{
				Object.defineProperty(tmpData,p,{
					value:data[p],
					writable:true,
					configurable:true
				});
			}
		}

		return tpl(tmpData);

	},

	mainRule  =function(parsedData){

		var initRaw=fs.readFileSync(path.join(__dirname,'d','init.odb.json'));
		var data   =JSON.parse(initRaw);

		data.info['schema-version']++;
		data.schema.version=data.schema.version+1;

		//compiling classes;
		parsedData.classes.forEach(function(v,i){

			//compiling properties
			v.properties.forEach(function(vp,ip){
				v.properties[ip]=compileTpl('classProperty',vp);
			});

			var clusterId=-1;

			if(v.hasOwnProperty('abstract')&&v.abstract){

				delete v.abstract;

			}else{

				clusterId=rules.meta.clusterStartId+i+1;

				//adding a cluster for the class
				data.clusters.push(compileTpl('cluster',{
					"name":v.name.toLowerCase(),
					"id":clusterId
				}));

			}

			v.defaultClusterId=clusterId;
			v.clusterIds=[clusterId];

			//adding compiled class
			data.schema.classes.push(compileTpl('schemaClass',v));

		});

		return data;

	}
;

module.exports={
	run:mainRule
};
