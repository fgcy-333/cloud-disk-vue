<template>
  <div>
    <div class="FunctionBar">
      <div class="left">
        <el-upload
            multiple
            :action="`/disk/file/upload/${$store.state.currentFolderId}?userId=${$store.state.userInfo.portalUserId}`"
            class="uploadButton"
            :show-file-list="false"
            :on-success="upload"
            :on-error="onError"
            :on-progress="onProgress"
            :before-upload="beforeUpload"
            v-if="barType == 'file' && $route.params.path.search('search') == -1">
          <el-button type="primary" size="small" class="upload">
            <i class="iconfont icon-yunshangchuan"></i> 上传
          </el-button>
        </el-upload>


        <el-button
            v-if="barType == 'file' && $route.params.path.search('search') == -1"
            size="small"
            class="create"
            @click="createFolder"
            :disabled="!isCreateAble">
          <i class="iconfont icon-add"></i> 新建
        </el-button>

        <el-button
            size="small"
            class="selectAll"
            :class="isSelectAll ? 'select' : ''"
            @click="selectAll">
          <i class="iconfont icon-complete"></i>
          全选
        </el-button>

        <el-button
            size="small"
            @click="multipleDownload"
        >
          <i class="el-icon-download"></i>
          下载
        </el-button>


        <!-- 多选操作按钮 -->
        <div class="multButtons" v-if="isMultBtnsShow">
          <div class="tips">多选操作按钮</div>
          <div class="multButtonsContainer">
            <div @click="$emit('multDownload')">
              <i class="iconfont icon-bottom"></i> 下载
            </div>
            <div
                @click="$emit('multCollect', true)"
                v-if="!$store.state.isAllFileCollect">
              <i class="iconfont icon-favorite"></i> 收藏
            </div>
            <div @click="$emit('multCollect', false)" v-else>
              <i class="iconfont icon-favorite"></i> 取消收藏
            </div>
            <div @click="$emit('multDelete')">
              <i class="iconfont icon-ashbin"></i> 删除
            </div>
            <div v-if="barType == 'file'" @click="$emit('multMove')">
              <i class="iconfont icon-yidong"></i>
              移动到
            </div>
          </div>
        </div>
      </div>

      <!-- 右边 -->
      <div class="right">
        <div class="search">
          <el-input
              placeholder="请输入内容"
              suffix-icon="el-icon-search"
              v-model="searchContent"
              @keyup.native.enter="$emit('goSearch', searchContent)"
          >
          </el-input>
        </div>
        <div class="sortType">
          <el-popover width="150" trigger="hover" :visible-arrow="false">
            <div
                class="sortTypeItem"
                @click="$store.commit('updateSortType', 'time')"
            >
              <i
                  class="iconfont icon-select"
                  v-show="$store.state.sortType == 'time'"
              ></i>
              按修改时间排序
            </div>
            <div
                class="sortTypeItem"
                @click="$store.commit('updateSortType', 'size')"
            >
              <i
                  class="iconfont icon-select"
                  v-show="$store.state.sortType == 'size'"
              ></i>
              按文件大小排序
            </div>
            <i slot="reference" class="iconfont icon-paixu"></i>
          </el-popover>
        </div>
        <div class="displayType" @click="changeShowType">
          <i
              class="iconfont icon-paixu1"
              v-if="$store.state.showType == 'icon'"></i>
          <i class="iconfont icon-sifangge" v-else></i>
        </div>
      </div>

      <!-- 进度条提示框 -->
      <!-- <progress-dialog
        :isUploadProgressShow="isUploadProgressShow"
        :uploadProgress="uploadProgress"
      ></progress-dialog> -->
      <div
          class="goLastFolder"
          v-if="$store.state.historyStackPoint>0">
        <a @click.prevent="goLastFolder">返回上一级</a>
        <span v-for="item in pathArr" :key="item">
        <span v-show="item!=='全部文件'"> ></span>
         <a @click.prevent="turnToOther(item)">{{ item }}</a>
        </span>

      </div>
    </div>
    <div class="tableHead" v-if="$store.state.showType == 'table'">
      <div class="tableName tableHeadName">文件名</div>
      <div class="tableCollect"></div>
      <div class="tableItemSize">大小</div>
      <div class="tableItemCreateTime">修改日期</div>
    </div>
  </div>
</template>

<script>
import ProgressDialog from "../progressDialog/ProgressDialog.vue";
import axios from "axios";

export default {
  name: "FunctionBar",
  components: {
    ProgressDialog,
  },
  props: {
    // functionbar的类型 file collect
    barType: {
      type: String,
      default() {
        return "file";
      },
    },
  },
  data() {
    return {
      //   是否点击了全选按钮
      isSelectAll: false,
      isCreateAble: true,
      // 上传按钮是否是加载状态
      isUploadBtnLoading: false,
      // 是否显示多选操作按钮
      isMultBtnsShow: false,
      // 搜索内容
      searchContent: "",
    };
  },
  computed: {
    pathArr() {
      let historyStack = this.$store.state.historyStack;
      let arr = [];
      historyStack.forEach(obj => {
        if (obj.name === 'root') {
          arr.push("全部文件");
        } else {
          arr.push(obj.name)
        }
      });
      return arr;
    }
  },
  methods: {
    //多文件下载
    multipleDownload() {
      const fileList = this.$store.state.selectFiles;
      fileList.forEach(obj => {
        obj.check = false;
      })

      this.$store.commit("updateSelectFiles", []);

      if (fileList.length <= 0) {
        this.$message.error("请至少选择一个文件")
        return;
      } else {
        let folderIdStr = "";
        let fileIdStr = "";
        fileList.forEach(obj => {
          if (obj.type === 'folder') {
            folderIdStr = obj.id + ","
          } else {
            fileIdStr = obj.fileId + ",";
          }
        });

        //拼接字符串
        if (folderIdStr.length >= 1) {
          folderIdStr = folderIdStr.substring(0, folderIdStr.length - 1);
        }
        if (fileIdStr.length >= 1) {
          fileIdStr = fileIdStr.substring(0, fileIdStr.length - 1);
        }

        // 文件夹下载
        const url = `/disk/folder/download?fileIds=${fileIdStr}&folderIds=${folderIdStr}`;
        axios.get(url,
            {
              responseType: "blob"
            }
        ).catch(err => {
          console.log(err)
        })
            .then(res => {
              let str = res.headers["content-disposition"];
              let fileName = str.substring(str.indexOf("=") + 1);
              debugger
              if (!res) {
                this.$message.error("文件下载失败，请稍后重试!");
                return;
              }
              let blob = new Blob([res.data])
              let downloadElement = document.createElement('a')
              let href = window.URL.createObjectURL(blob); //创建下载的链接
              downloadElement.href = href;
              downloadElement.download = fileName; //下载后文件名
              document.body.appendChild(downloadElement);
              downloadElement.click(); //点击下载
              document.body.removeChild(downloadElement); //下载完成移除元素
              window.URL.revokeObjectURL(href); //释放blob对象
            })
      }
    },

    turnToOther(item) {
      let index = 0;
      for (let i = 0; i < this.pathArr.length; i++) {
        if (this.pathArr[i] === item) {
          index = i;
        }
      }
      console.log("####", this.pathArr)

      //历史返回
      this.$store.commit("backHistoryStack", index);
      //获取上一级历史栈的信息
      let historyStack = this.$store.state.historyStack[index];
      //更新全局当前文件夹id
      this.$store.commit("updateCurrentFolderId", historyStack.id)

    },

    selectAll() {
      this.isSelectAll = !this.isSelectAll;
      this.$store.commit("updateIsSelectAll", this.isSelectAll);
    },
    // 点击新建的回调
    createFolder() {
      // 先禁用新建按钮，避免重复点击
      this.isCreateAble = false;
      // 更新新建文件夹状态到vuex
      this.$store.commit("updateIsCreateFolder", true);
    },

    // 上传成功的钩子
    async upload(response, file) {
      // console.log("上传文件后回调：",response);
      if (!response.success) {
        this.$message.error("上传失败,请稍后重试!");
        // this.isUploadProgressShow = false;
        let arr = this.$store.state.uploadProgressList;
        let idx = arr.findIndex((item) => item.name == file.name);
        arr.splice(idx, 1);
        this.$store.commit("updateUploadProgressList", arr);
        return;
      }
      // this.isUploadProgressShow = false;
      let arr = this.$store.state.uploadProgressList;
      let idx = arr.findIndex((item) => item.name == file.name);
      arr.splice(idx, 1);
      this.$store.commit("updateUploadProgressList", arr);

      if (response.success) {
        this.$message.success("文件上传成功!");
        this.$emit("flushData", 0);
        // this.$emit("pushUploadData", res.data.data.file);

        // 更新用户存储空间
        /*  let userInfo = this.$store.state.userInfo;
          userInfo.neicun += response.data.file.size;
          this.$store.commit("updateUserInfo", userInfo);*/
      } else {
        this.$message.error("文件上传失败，请稍后重试!");
      }
    },

    // 上传失败的钩子
    onError(err, file) {
      //   console.log(err);
      // this.isUploadProgressShow = false;
      let arr = this.$store.state.uploadProgressList;
      let idx = arr.findIndex((item) => item.name == file.name);
      arr.splice(idx, 1);
      this.$store.commit("updateUploadProgressList", arr);
      this.$message.error("文件上传失败，请稍后重试!");
    },

    // 文件上传时的钩子
    onProgress(e, file) {
      // console.log(e, file);
      // this.isUploadProgressShow = true;
      // this.uploadProgress = Math.round(file.percentage);
      // console.log(this.uploadProgress);
      let arr = this.$store.state.uploadProgressList;
      arr.findIndex((item, index, arr) => {
        if (item.name == file.name) {
          arr[index].progress = Math.round(file.percentage);
          return 1;
        }
      });
      this.$store.commit("updateUploadProgressList", arr);
    },

    // 文件上传之前的钩子
    //给一手进度条
    beforeUpload(file) {
      console.log(file);
      let arr = this.$store.state.uploadProgressList;
      arr.push({name: file.name, progress: 0});
      this.$store.commit("updateUploadProgressList", arr);
    },

    // 返回上一级文件夹
    goLastFolder() {
      //当前历史栈的下标
      let currentIndex = this.$store.state.historyStackPoint;
      //历史返回
      this.$store.commit("backHistoryStack", currentIndex - 1);
      //获取上一级历史栈的信息
      let historyStack = this.$store.state.historyStack[currentIndex - 1];
      //更新全局当前文件夹id
      this.$store.commit("updateCurrentFolderId", historyStack.id)
    },

    // 点击切换展示类型
    changeShowType() {
      if (this.$store.state.showType == "icon") {
        // this.showType = "table";
        // this.$emit("changShowType", "table");
        this.$store.commit("updateShowType", "table");
      } else {
        // this.showType = "icon";
        // this.$emit("changShowType", "icon");
        this.$store.commit("updateShowType", "icon");
      }
    },
  },
  watch: {
    "$store.state.isSelectAll"(current) {
      this.isSelectAll = current;
    },

    // 监听是否正在创建文件夹
    "$store.state.isCreateFolder"(current) {
      if (current == false) {
        this.isCreateAble = true;
      }
    },
    "$store.state.selectFiles"(current) {
      if (current.length > 0) {
        this.isMultBtnsShow = true;
      } else {
        this.isMultBtnsShow = false;
      }
    },
  },
  created() {
    // 每次进入时先重置vuex中的isSelectAll
    this.$store.commit("updateIsSelectAll", false);
    if (
        this.barType == "file" &&
        this.$route.params.path.search("search") != -1
    ) {
      this.searchContent = this.$route.params.path
          .split("/")
          [this.$route.params.path.split("/").length - 1].split("?")[1];
    }
  },
};
</script>

<style scoped>
.FunctionBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100vw - 280px);
  min-width: 980px;
  /* background-color: pink; */
  height: 80px;
  padding: 10px 20px;
  position: relative;
  top: 0;
  left: 0px;
  z-index: 50;
}

.el-input /deep/ input {
  width: 14vw;
  border-radius: 30px;
  height: 35px;
  line-height: 35px;
  background-color: #f1f2f3;
  border: 1px solid #f1f2f3;
}

.el-input /deep/ i {
  line-height: 35px !important;
  color: #687176;
}

.right {
  display: flex;
  align-items: center;
}

.right i {
  font-size: 20px;
  color: #a0a0a0;
  font-weight: bold;
}

.right > div {
  margin-right: 15px;
}

.select {
  background-color: #696bcc !important;
  color: white !important;
  border: 1px solid #696bcc !important;
}

.selectAll:hover {
  background-color: #595bb3;
  color: white;
}

i {
  cursor: pointer;
}

.sortTypeItem {
  font-size: 13px;
  padding: 10px 0 10px 40px;
  position: relative;
  cursor: pointer;
  color: #595bb3;
}

.sortTypeItem i {
  position: absolute;
  left: 13px;
  color: #595bb3;
}

.sortTypeItem:hover {
  background-color: #efeff5;
}

.left {
  display: flex;
}

.uploadButton {
  margin-right: 10px;
}

.uploadProgress {
  width: 230px;
}

.multButtons {
  display: flex;
  align-items: center;
  font-size: 14px;
  transform: scale(0.9);
}

.tips {
  color: rgb(177, 177, 177);
}

.multButtonsContainer {
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  color: rgb(97, 97, 97);
  margin-left: 10px;
  overflow: hidden;
}

.multButtonsContainer div {
  padding: 8px 15px;
  border-right: 1px solid #ccc;
  cursor: pointer;
}

.multButtonsContainer div:nth-last-child(1) {
  border: none;
}

.multButtonsContainer div:hover {
  background-color: #595bb3;
  color: white;
}

.goLastFolder {
  cursor: pointer;
  color: #595bb3;
  font-size: 14px;
  margin-left: 20px;
  position: absolute;
  bottom: 0;
  left: 0;
}

.goLastFolder a {
  margin: 0 5px;
}

.tableHead {
  display: flex;
  line-height: 50px;
  height: 50px;
  width: calc(100vw - 260px);
  padding: 0 25px;
  box-sizing: border-box;
  font-size: 15px;
}

.tableName {
  line-height: 43px;
  width: 50%;
}

.tableHeadName {
  width: calc(50% + 43px);
  padding: 0;
}

.tableItemSize {
  width: 20%;
  padding-left: 80px;
  box-sizing: border-box;
}

.tableItemCreateTime {
  padding-left: 60px;
  box-sizing: border-box;
  width: 25%;
}

.tableCollect {
  width: 10%;
  text-align: center;
}
</style>
