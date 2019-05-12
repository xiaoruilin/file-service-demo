; (function ($) {
    WebUploader.Uploader.register({
        "before-send-file": "beforeSendFile",
        "before-send": "beforeSend"
    }, {
            "beforeSendFile": function (file) {
                var _this = this.owner;
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
                                } else {
                                    deferred.reject(d);
                                }
                                //获取文件信息后进入下一步 
                                deferred.resolve();
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


                var fileUpload = $("#picker").find(':input[type="file"]').get(0);
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

        return WebUploader.create(_this.opts);
    }

    $.fn.webuploader.defaults = {
        pick: {
            id: '#picker',
            //label: '点击选择文件'
        },
        auto: true,
        swf: './webuploader-0.1.5/Uploader.swf',
        chunked: true, //分片处理大文件
        chunkSize: 1 * 1024 * 1024,
        serverroot: 'http://localhost:5000/',
        server: 'http://localhost:5000/files',
        ownerToken: '2HGNr048HJPZ8MFLRenwpgeAjurwCAAAAAQAAAAEAAAAAXNdzOA',
        disableGlobalDnd: true,
        threads: 1, //上传并发数
        fileNumLimit: 300,
        compress: false, //图片在上传前不进行压缩
        fileSizeLimit: 1024 * 1024 * 1024,    // 1024 M
        fileSingleSizeLimit: 1024 * 1024 * 1024,    // 1024 M
        //允许重复上传
        duplicate: true,
        onUploadProgress: function (file, percent) {//一般用此事件做页面信息提示
            console.info('xxx', this.getFile(file.id));
            return true;
            //trtds.find('.progressDiv span').html(percent == 1 ? '正在合并文件' : (percent < 0 ? ' 计算md5进度:' : ' 上传进度:') + Math.floor(percent * 100));
        }
    };
})(jQuery);