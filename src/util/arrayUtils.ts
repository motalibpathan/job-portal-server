// selects a number random elements in order
export function selectInOrder<A>(arr: A[], length: number): A[] {
  const myArr: A[] = [];
  const probMark = length / arr.length;

  // if length greater than array size
  if (arr.length < length) return arr;

  let currentIndex = 0;

  while (myArr.length < length) {
    const prob = Math.random();
    if (prob < probMark) {
      myArr.push(arr[currentIndex]);
    }
    if (arr.length - currentIndex === length - myArr.length) {
      arr.forEach((elem) => myArr.push(elem));
      break;
    } else {
      currentIndex++;
    }
  }

  return myArr;
}

export function chunkArray<A>(inputArray: A[], perChunk: number) {
  return inputArray.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, [] as A[][]);
}
