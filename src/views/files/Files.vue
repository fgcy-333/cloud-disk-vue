<template>
  <div class="Files" v-loading="$store.state.loadingState">
    <function-bar
        @pushUploadData="pushUploadData"
        @multDelete="$refs.iconTypeList.deleteCurrentFile('mult')"
        @multDownload="$refs.iconTypeList.downloadCurrentFile('mult')"
        @multMove="$refs.iconTypeList.moveFile('mult')"
        @changeSortType="(type) => (sortType = type)"
        @changShowType="(type) => (showType = type)"
        @goSearch="goSearch"
        @multCollect="
        (flag) => {
          $refs.iconTypeList.collectCurrentFile(flag, 'mult');
        }
      "
        @flushData="refreshData"></function-bar>
    <icon-type-list
        :listData="listData"
        :folderList="folderList"
        :sortType="sortType"
        :showType="showType"
        :searchFolder="searchFolder"
        @getListData="getListData"
        @getFolderList="getFolderList"
        ref="iconTypeList"
        @flushData="refreshData"
    ></icon-type-list>
  </div>
</template>

<script>
import FunctionBar from "components/functionBar/FunctionBar.vue";
import IconTypeList from "components/iconTypeList/IconTypeList.vue";

export default {
  name: "Files",
  data() {
    return {
      listData: [],
      folderList: {},
      // 是否已经被创建
      // isCreated: false,
      // 排序方式
      sortType: "time",
      // 展示方式 icon table
      showType: "icon",
      // 搜索的文件夹
      searchFolder: [],

      time: 0
    };
  },
  components: {
    FunctionBar,
    IconTypeList,
  },
  methods: {

    //刷新数据
    refreshData(ms) {
      //状态为加载状态
      this.$store.commit("updateLoadingState", true);
      this.getFolderList();
      this.getListData();

      if (this.time === 2) { //状态为完成状态
        setTimeout(() => {
          this.$store.commit("updateLoadingState", false);
          // 时间间隔
        }, ms ? ms : 0);
        this.time = 0
      }
    },

    // 请求文件列表
    async getListData() {
      let res = await this.$request(
          `/file/list/${this.$store.state.currentFolderId}`,
          this.$route.params.path,
          "get",
          "params",
          "json"
      );
      console.log("res", res);
      if (res.success) {
        this.listData = res.data.files;
        this.time++;

        await this.getVideoList(res.data.files);
      } else {
        this.$message.error("获取文件列表失败,请刷新页面重试!");
      }
    },

    // 获取文件目录树
    async getFolderList(dir) {
      //展示用户第一层的文件夹中的内容
      if (!dir) {
        //获取用户第一层的文件夹id
        if (!this.$store.state.hasCurrentFolderId) {
          this.$store.state.currentFolderId = JSON.parse(window.localStorage.getItem("userInfo")).rootFolderId;
          this.$store.state.rootFolderId = JSON.parse(window.localStorage.getItem("userInfo")).rootFolderId;

          let res = await this.$request(`/folder/list/${this.$store.state.currentFolderId}`, null, "get");

          this.$store.commit("updateHasCurrentFolderId", true);
          console.log("用户第一层的文件夹:", res.data.dir)
          //修改vuex中的历史栈信息
          this.$store.commit("updateHistoryStackInfo", {
            id: res.data.dir.id,
            name: res.data.dir.name.substring(0, res.data.dir.name.length - 1)
          })
        }

        //请求获取文件夹列表
        let res = await this.$request(`/folder/list/${this.$store.state.currentFolderId}`, null, "get");
        this.folderList = res.data.dir;
        this.time++;


        //修改vuex中的文件夹列表
        this.$store.commit("updateFolderList", res.data.dir);
        this.$store.commit("updateIsGetingFolder", false);

      } else {
        this.folderList = JSON.parse(dir);
        this.$store.commit("updateFolderList", JSON.parse(dir));
        this.$store.commit("updateIsGetingFolder", false);
      }
    },

    // 获取当前文件中的所有video文件
    getVideoList(listData) {
      listData.forEach(async (item, index, arr) => {
        if (item.filetype === "video") {
          arr[index].url = await this.getVideoUrl(item.videoId);
        }
      });
    },

    // 根据传入videoId获取url
    async getVideoUrl(videoId) {
      let res = await this.$request(
          "/eduoss/fileoss/getPlayAuth?isList=" + videoId,
          "",
          "post"
      );
      return res.data.data.urlList[0].url;
    },

    // 将上传成功的对象push到当前listData中
    async pushUploadData(item) {
      if (item.filetype == "video") {
        item.url = await this.getVideoUrl(item.videoId);
      }
      this.listData.push(item);
    },

    // 搜索
    goSearch(content) {
      // 如果路径中已经有搜索了 则替换之前的路径
      let path;
      if (this.$store.state.currentFolder.search("search") != -1) {
        path = this.$store.state.currentFolder.split("/search")[0];
      } else {
        path = this.$store.state.currentFolder;
      }
      this.$router.push({
        name: "files",
        params: {
          path: path + `/search?${content}`,
        },
      });
    },
  },
  computed: {
    currentFolderId() {
      return this.$store.state.currentFolderId;
    }
  },
  // 注意：在子文件夹中刷新会导致子文件夹的key变为vuex的初始currentFolder 也就是空
  async created() {
    // 如果vuex中的当前文件夹为空 就在这里更新一下  watch监听不到第一次加入files时的路由变化
    if (this.$store.state.currentFolder == "") {
      this.$store.commit("updateCurrentFolder", this.$route.params.path);
    }

    await this.getFolderList();


    this.$route.params.path.search("search"); //找不到返回-1
    if (this.$route.params.path.search("search") == -1) {
      await this.getListData();
      // this.isCreated = true;
    } else {
      let data =
          this.$route.params.path.split("/")[
          this.$route.params.path.split("/").length - 1
              ];
      let content = data.split("?")[1];
      let res = await this.$request(
          `/educenter/file/findFile/${this.$store.state.userInfo.id}/${content}`,
          "",
          "post"
      );
      if (!res.data.success) return;
      if (this.$store.state.sortType == "size") {
        res.data.data.fileList.sort((a, b) => {
          return a.size - b.size;
        });
      }
      this.listData = res.data.data.fileList;
      this.searchFolder = res.data.data.list;
      await this.getVideoList(this.listData);
    }
  },
  watch: {
    //监视器 ：只要当前文件夹id更新了 就会属性数据
    currentFolderId() {
      if (this.$store.state.hasCurrentFolderId) { //状态为加载状态
        this.$store.commit("updateLoadingState", true);
        this.getFolderList();
        this.getListData();

        if (this.time === 2) { //状态为完成状态
          setTimeout(() => {
            this.$store.commit("updateLoadingState", false);
            // 时间间隔
          }, 250);
          this.time = 0
        }
      }
    }
  },
};
</script>

<style scoped>
.Files {
  width: 100%;
}
</style>
