from flask import Blueprint, request, session
from project.services.auth_service import AuthService
from project.utils.response import success, error

auth_bp = Blueprint("auth", __name__)
auth_service = AuthService()


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return error("用户名和密码不能为空", code=400)
    if len(username) < 3 or len(password) < 6:
        return error("用户名至少3位，密码至少6位", code=400)

    user, err = auth_service.register(username, password)
    if err:
        return error(err, code=409 if "已存在" in err else 500)
    return success(user, message="注册成功", code=201)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return error("用户名和密码不能为空", code=400)

    user, err = auth_service.login(username, password)
    if err:
        return error(err, code=401)
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]
    return success(user, message="登录成功")


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return success(message="已退出登录")


@auth_bp.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return error("未登录", code=401)
    user = auth_service.get_user(user_id)
    if not user:
        return error("用户不存在", code=404)
    return success(user)
