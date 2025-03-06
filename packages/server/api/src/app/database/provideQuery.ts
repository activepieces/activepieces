const DB = require('./db');

export const query = async (query: any) => {
  let rows = [];
  // DB.pool.connect();
  let catchuse = false;
  var client = await DB.pool.connect();
  try {
    const result = await client.query(query);
    // const result = await DB.client.query(query);
    rows = result ? result.rows : [];
  } catch (err) {
    console.error(err);
    // client.release(true);
    catchuse = true;
  } finally {
    // await client.end();
    client.release();
  }
  // if (!catchuse) client.release();
  if (DB.pool.idleCount >= 10) {
    // console.log("new v pool.idleCount : ", DB.pool.idleCount);
  }
  // if(pool.idleCount === 0)

  return rows;
};

export const update = async (query: any, parameters?: any[]) => {
  let rows = [];
  // DB.pool.connect();
  let catchuse = false;
  var client = await DB.pool.connect();
  try {
    const result = await client.query(query,parameters);
    // const result = await DB.client.query(query);
    rows = result ? result.rows : [];
  } catch (err) {
    console.error(err);
    // client.release(true);
    catchuse = true;
  } finally {
    // await client.end();
    client.release();
  }
  // if (!catchuse) client.release();
  if (DB.pool.idleCount >= 10) {
    // console.log("new v pool.idleCount : ", DB.pool.idleCount);
  }
  // if(pool.idleCount === 0)

  return rows;
};


