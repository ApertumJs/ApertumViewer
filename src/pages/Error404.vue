<script lang="ts">
export default {
  name: 'PageError404',
};
</script>
<template>
<div id="page-body">
  <div style="font-size: 20vh">404 Error</div>
  <div style="font-size: 10vh;opacity:.4">
    Oops. Nothing here...
  </div>
  <img  src="../assets/logo.png"/>
</div>
</template>

<style scoped>
#page-body{
  display: grid;
  place-items: center;
}

img{
  margin: 10em auto;
  width: 600px;
}

</style>
