const { createApp, ref, onMounted, onBeforeUnmount } = Vue;

createApp({
  setup() {
    const data = ref([]);
    const page = ref(1);
    const isLoading = ref(false);

    const fetchData = async () => {
      if (isLoading.value) return; // Prevent duplicate requests

      isLoading.value = true; // Set loading state to true

      try {
        const response = await fetch(`/api/new_media?page=${page.value}`);
        const result = await response.json();
        data.value.push(...result); // Append new data to existing data
        page.value = page.value + 1;
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        isLoading.value = false; // Reset loading state
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if we are at the bottom of the page
      if (scrollY + windowHeight >= documentHeight - 100) {
        // 100px buffer
        fetchData(); // Fetch more data
      }
    };

    onMounted(() => {
      fetchData(); // Initial fetch
      window.addEventListener("scroll", handleScroll); // Add scroll event listener
    });

    onBeforeUnmount(() => {
      window.removeEventListener("scroll", handleScroll); // Clean up event listener
    });

    return { data };
  },
  template: `

    <div v-for="d in data" id="section">
    <template v-for="media in d.newMedia">
    <template v-if="media.type === 'photo'">
        <a :href="media.media" class="glightbox">
                <img :src="media.media" id="photo" alt="image" loading="lazy"/>
            </a>
    </template>
    <template v-if="media.type === 'video'">
    <a :href="media.media" class="glightbox3" data-glightbox="type: video">
                <div style="position: absolute;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                            data-slot="icon" style="width: 48px;" fill="#ffffff90">
                        <path fill-rule="evenodd"
                                d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                                clip-rule="evenodd"/>
                    </svg>
                </div>
                <img :src="media.thumb" id="photo" alt="image" loading="lazy"/>
            </a>
    </template>
    </template>
    </div>
  
    <h1 v-if="isLoading">Loading...</h1>
  
  `,
  data() {},
  methods: {},
}).mount("#app");
