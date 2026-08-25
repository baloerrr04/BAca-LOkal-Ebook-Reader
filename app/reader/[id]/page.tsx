import ReaderClient from './ReaderClient'

export default async function ReaderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const bookId = params.id

  return (
    <div className="h-screen w-full overflow-hidden">
      <ReaderClient bookId={bookId} />
    </div>
  )
}
