const MAX_IMAGE_DIMENSION = 1_600
const WEBP_QUALITY = 0.82

export function fitImageWithinBounds(
  width: number,
  height: number,
): {
  height: number
  width: number
} {
  const largestDimension = Math.max(width, height)

  if (largestDimension <= MAX_IMAGE_DIMENSION) return { width, height }

  const scale = MAX_IMAGE_DIMENSION / largestDimension

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  const image = new Image()

  return new Promise((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to decode image'))
    }
    image.src = url
  })
}

async function decodeImage(file: File): Promise<{
  close?: () => void
  height: number
  source: CanvasImageSource
  width: number
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      })

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // Safari may not decode every image type through createImageBitmap.
    }
  }

  const image = await loadImage(file)

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}

export async function compressImage(file: File): Promise<Blob> {
  const { close, source, width, height } = await decodeImage(file)
  const targetSize = fitImageWithinBounds(width, height)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) throw new Error('Canvas is unavailable')

  canvas.width = targetSize.width
  canvas.height = targetSize.height
  context.drawImage(source, 0, 0, targetSize.width, targetSize.height)

  const encodedImage = new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Unable to encode image'))
      },
      'image/webp',
      WEBP_QUALITY,
    )
  })

  return encodedImage.finally(() => {
    close?.()
  })
}
