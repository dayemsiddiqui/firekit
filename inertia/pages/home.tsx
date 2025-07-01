import { Head } from '@inertiajs/react'
import { Button } from '../components/ui/button'

export default function Home() {
  return (
    <>
      <Head title="Homepage" />
      <h1>Hello World</h1>
      <Button>Click me</Button>
    </>
  )
}
