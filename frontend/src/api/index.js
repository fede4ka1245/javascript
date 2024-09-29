export const uploadFile = (file) => {
  const formdata = new FormData();
  formdata.append("file", file, file.fileName);

  const requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };

  return fetch(`${process.env.REACT_APP_SERVER_API}/upload`, requestOptions)
    .then((res) => {
      return res.text()
    });
}

export const getUpload = (id) => {
  return fetch(`${process.env.REACT_APP_SERVER_API}/uploads/${id}`)
    .then((res) => res.text())
    .then(JSON.parse);
}

export const getShorts = (id) => {
  return fetch(`${process.env.REACT_APP_SERVER_API}/uploads/${id}/shorts`)
    .then((res) => res.text())
    .then(JSON.parse);
}

export const getStorageUrl = (path) => {
  return `${process.env.REACT_APP_S3_API}${path}`;
}

export const getStorage = (path) => {
  return fetch(getStorageUrl(path))
    .then((res) => res.text());
}

export const getState = (id) => {
  return fetch(`${process.env.REACT_APP_SERVER_API}/uploads/${id}/state`)
    .then((res) => {
      if (res.status === 404) {
        throw new Error('Not found');
      }

      return res.json();
    });
}