


export async function callApi(endPoint: string, accessToken: string) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers
  };

  return fetch(endPoint, options)
    .then(response => response.json())
    .catch(error => {
      console.log(error);
      throw error;
    });
}
