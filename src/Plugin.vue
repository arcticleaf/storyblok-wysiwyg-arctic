<template>
  <div class="arctic-wysiwyg">
    <div class="arctic-wysiwyg__wrapper" v-show="modalIsOpen">
      <textarea class="arctic-wysiwyg__editor"></textarea>
      <div class="uk-clearfix uk-margin-top uk-text-right">
        <p class="uk-text-muted">
          Closing the editor will not save your content immediately<br />make
          sure to save your content entry after closing it.
        </p>
        <button class="uk-button uk-button-primary" @click="closeModal">
          Close Editor
        </button>
      </div>
    </div>

    <pre
      class="arctic-wysiwyg__debugger"
      v-if="debug && modalIsOpen"
    >DEBUG OUTPUT<br><code>{{model.content}}</code></pre>

    <div v-if="!modalIsOpen">
      <button class="uk-button uk-width-1-1" @click="openModal">
        Open Editor
      </button>
    </div>
  </div>
</template>

<script>
export default {
  mixins: [window.Storyblok.plugin],
  data() {
    return {
      storyblok: null,
      modalIsOpen: false,
    };
  },
  computed: {
    debug() {
      return this.options.debug || false;
    },
  },
  methods: {
    initWith() {
      return {
        plugin: "arctic-wysiwyg",
        content: "",
      };
    },
    pluginCreated() {
      // Load your wysiwyg editor of choice
      this.$sb.getScript(
        "https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.9.2/tinymce.min.js",
        () => {
          // editor loaded now lets init it
          window.tinymce.init({
            selector: "textarea",
            height: "600",
            plugins: "image",
            setup: (editor) => {
              // init tinymce
              editor.on("init", () => {
                editor.setContent(this.model.content);
              });
              // when typing keyup event
              editor.on("keyup", () => {
                // set model value
                this.model.content = editor.getContent();
              });
            },
          });
        }
      );
    },

    // you can utilitze our management API to upload images
    // to Storyblok or your own server, below function
    // uploads to our S3 by using our signed upload requests
    // https://www.storyblok.com/docs/management-api/assets#sign-asset
    storyblokImageUpload(blobInfo, success, failure) {
      this.api.client
        .post(
          `/spaces/${this.spaceId}/assets`,
          { filename: blobInfo.filename() },
          { headers: { Authorization: this.options.oauthToken } }
        )
        .then((response) => {
          let request = new XMLHttpRequest();
          request.withCredentials = false;
          request.open("POST", response.data.post_url);

          request.onreadystatechange = () => {
            const allowedStatuses = [200, 201, 204];

            if (request.readyState === 4) {
              if (allowedStatuses.includes(request.status)) {
                // eslint-disable-next-line
                console.log("Image uploaded: " + response.data.pretty_url);
                success({ location: response.data.pretty_url });
              } else {
                failure(
                  new Error(
                    `Error during upload with status: ${request.status}`
                  )
                );
              }
            }
          };

          let formData = new FormData();
          for (let key in response.data.fields) {
            formData.append(key, response.data.fields[key]);
          }
          formData.append("file", blobInfo.blob());
          request.send(formData);
        })
        .catch((error) => {
          failure(error);
        });
    },
    openModal() {
      this.$emit("toggle-modal", true);
      this.modalIsOpen = true;
    },
    closeModal() {
      this.$emit("toggle-modal", false);
      this.modalIsOpen = false;
    },
  },
  watch: {
    model: {
      handler(value) {
        this.$emit("changed-model", value);
      },
      deep: true,
    },
  },
};
</script>

<style>
.arctic-wysiwyg {
  max-width: 100%;
}
.arctic-wysiwyg__wrapper {
  margin: 0px auto;
  padding: 0px 10px;
}
.arctic-wysiwyg__debugger {
  padding: 20px;
  background: #192540;
  border-radius: 5px;
  overflow-x: auto;
  overflow-y: hidden;
  color: #dde4e8;
  display: block;
  font-family: monospace;
  white-space: pre;
  margin: 1em 0px;
}
</style>
