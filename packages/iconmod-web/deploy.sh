pnpm run build

ssh -t root@118.26.38.32 rm -fr /home/ubuntu/dockers/nginx/html/iconmod/*

scp -r dist/* root@118.26.38.32:/home/ubuntu/dockers/nginx/html/iconmod/

echo "Deply Success !"