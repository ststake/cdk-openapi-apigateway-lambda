import app from "../app";

const port = 9080;
app.listen(port, () => {
  console.info(`Listening at http://localhost:${port}`);
});