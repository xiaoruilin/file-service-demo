; (function ($) {
    if (!$) {
        alert("请先引用jquery!");
        return;
    }

    if (!window.WebUploader) {
        _alert("请先引用webuploader.min.js!");
        return;
    }

    WebUploader.Uploader.register({
        "before-send-file": "beforeSendFile",
        "before-send": "beforeSend"
    }, {
            "beforeSendFile": function (file) {
                var _this = this.owner;
                _this.options.serverroot=_this.options.serverroot||_this.options.server;
                if(!_this.options.serverroot){
                    alert("请设置上传服务路径！");
                }
                var deferred = WebUploader.Deferred();
                _this.options.server = _this.options.serverroot + "files";
                //1、计算文件的唯一标记，用于断点续传 
                (new WebUploader.Uploader()).md5File(file, 0, 10 * 1024 * 1024)
                    .progress(function (percentage) {
                        console.log("正在读取文件");
                    }).then(function (val) {
                        _this.stop(true);
                        $.ajax({
                            url: _this.options.server, type: 'POST', dataType: "json",
                            data: { periodMinute: 0, hash: val, ownerToken: _this.options.ownerToken, fileName: file.name },
                            success: function (d) {
                                _this.upload();
                                console.info("sssss", d);
                                if (d.errCode == 100) {
                                    _this.options.formData = $.extend(_this.options.formData, {
                                        periodMinute: 0,
                                        hash: val,
                                        ownerToken: _this.options.ownerToken,
                                        fileName: file.name
                                    });
                                    console.log("成功获取文件信息……");
                                }
                                else {
                                    _this.on("uploadSuccess", _this.options.onUploadSuccess(file,d));
                                    deferred.reject(d);
                                }
                                //获取文件信息后进入下一步 
                                deferred.resolve(d);
                            },
                            error: function (returndata) {
                                console.info("Check File Error:", returndata);
                            }
                        });
                    });
                return deferred.promise();
            },
            "beforeSend": function (block) {
                var _this = this.owner;
                var deferred = WebUploader.Deferred();
                _this.options.serverroot=_this.options.serverroot||_this.options.server;
                if(!_this.options.serverroot){
                    alert("请设置上传服务路径！");
                }
                var fileUpload = $(_this.options.pick.id).find(':input[type="file"]').get(0);
                var files = fileUpload.files;
                var data = new FormData();
                for (var i = 0; i < files.length; i++) {
                    data.append(files[i].name, files[i]);
                }
                this.options.formData = $.extend(this.options.formData, { file: data });

                var curChunk = block.chunk;
                var totalChunk = block.chunks;

                if (totalChunk > 1) {
                    _this.options.server = _this.options.serverroot + "files/fromBlock";
                    $.extend(this.options.formData, { curBlock: curChunk, blockTotal: totalChunk });
                }

                deferred.resolve();
                return deferred.promise();
            }
        });

    $.fn.webuploader = function (options) {
        if (typeof options === 'string') {
            var method = $.fn.foldpanel.methods[options];
            if (method) {
                return method(this, param);
            }
        }
        
        options = options || {};

        var _this = this;
        _this.opts = $.extend({}, $.fn.webuploader.defaults, options);

        //如果上传组件没有则自动产生一个
        if(!_this.opts.pick|| !_this.opts.pick.id){
            var $pickerwuhidden= $('<div style="display:none;"></div>').insertAfter(_this).end();
            _this.opts = $.extend(_this.opts, {pick: {id:$pickerwuhidden[0]}});

            $(_this).click(function(){
                var tmp = $pickerwuhidden.find(':input[type="file"]').next();
                if (tmp.length) {
                    tmp.click();
                }
                else {
                    setTimeout(function () {
                        pickerwuhidden.find(':input[type="file"]').next().click();
                    }, 100);
                }

                var upfilebtnData = $(this).data("upfilebtnData");
                if (_this.opts.onUploadFile) {
                    _this.opts.onUploadFile.call(this, upfilebtnData.value, upfilebtnData.rowData, upfilebtnData.rowindex);
                }
            });
        }

        var uploader=WebUploader.create(_this.opts);
        if(_this.opts.pickupload){
            $(_this.opts.pickupload).click(function(){
                uploader.upload();
            });
        }
        return uploader;
    }

    $.fn.webuploader.defaults = {
        pickupload:null,
        // pick: {
        //     id: '#picker',
        //     label: '点击选择文件'
        // },
        auto: true,
        swf: './webuploader-0.1.5/Uploader.swf',
        chunked: true, //分片处理大文件
        chunkSize: 1 * 1024 * 1024,
        //serverroot: 'http://localhost:5000/',
        server: 'http://localhost:5000/',
        ownerToken: '2bb6zshWzbc3oGg39qSNYptgfmUcCAAAAAQAAAAEAAAAAXPTifA',
        disableGlobalDnd: true,
        threads: 1, //上传并发数
        fileNumLimit: 300,
        compress: false, //图片在上传前不进行压缩
        fileSizeLimit: 1024 * 1024 * 1024,    // 1024 M
        fileSingleSizeLimit: 1024 * 1024 * 1024,    // 1024 M
        //允许重复上传
        duplicate: true,
        onUploadProgress: function (file, percent) {//一般用此事件做页面信息提示
            console.info('onUploadProgress', this.getFile(file.id));
            return true;
            //trtds.find('.progressDiv span').html(percent == 1 ? '正在合并文件' : (percent < 0 ? ' 计算md5进度:' : ' 上传进度:') + Math.floor(percent * 100));
        },
        onUploadSuccess:function (file, response) {
            console.info("onUploadSuccess-file", file);
            console.info("onUploadSuccess-response", response);
        },
        onBeforeFileQueued:function (file) {
            console.info('onBeforeFileQueued', this.getFile(file.id));
            return true;
            //return false;  //阻止该文件上传
        },
        onFileQueued:function (file) {
            console.log('onFileQueued:', file);
        },
        onError:function (code, file) {
            var name = file.name;
            switch (code) {
                case "F_DUPLICATE":
                    str = name + "文件重复";
                    break;
                case "Q_TYPE_DENIED":
                    str = name + "文件类型 不允许";
                    break;
                case "F_EXCEED_SIZE":
                    var imageMaxSize = 9;//通过计算
                    str = name + "文件大小超出限制" + imageMaxSize + "M";
                    break;
                case "Q_EXCEED_SIZE_LIMIT":
                    str = "超出空间文件大小";
                    break;
                case "Q_EXCEED_NUM_LIMIT":
                    str = "抱歉，超过每次上传数量图片限制";
                    break;
                default:
                    str = name + " Error:" + code;
            }
            alert(str);
        }
    };
})(jQuery);