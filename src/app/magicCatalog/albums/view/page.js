'use client';

import { Suspense } from 'react';
import AlbumViewClient from '@mc/components/Albums/AlbumViewClient'

const page = () => {
  return (
    <Suspense>
      <AlbumViewClient />
    </Suspense>
  )
}

export default page
